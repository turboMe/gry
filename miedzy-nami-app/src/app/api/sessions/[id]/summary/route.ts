// ═══════════════════════════════════════════════════════════
//  GET /api/sessions/[id]/summary
//  Get session summary for post-game screen.
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/firebase/middleware';
import { getSession } from '@/lib/db/sessions';
import { getScenario } from '@/lib/db/scenarios';
import { calculateStyleDistribution } from '@/lib/engine/game-engine';
import type { SessionSummary } from '@/lib/types/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth) return unauthorizedResponse();

  try {
    const { id: sessionId } = await params;

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.user_id !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Load scenario for titles and post_game data
    const scenario = await getScenario(session.scenario_id);
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 500 });
    }

    // Find the ending
    const endingData = scenario.endings.find(e => e.ending_id === session.ending_id);
    if (!endingData) {
      return NextResponse.json({ error: 'Ending data not found' }, { status: 500 });
    }

    // Build choices breakdown
    const choicesBreakdown = session.choices.map(choice => {
      const interaction = scenario.interactions.find(
        i => i.interaction_id === choice.interaction_id
      );
      const bestChoice = interaction?.choices.reduce((best, c) =>
        c.points > best.points ? c : best
      , interaction.choices[0]);

      return {
        interaction_title: interaction?.title || choice.interaction_id,
        chosen: choice,
        best_choice_id: bestChoice?.choice_id || 'D',
      };
    });

    // Style distribution
    const styleDistribution = calculateStyleDistribution(session.choices);

    // Check if this is a new best score
    // (simplified — would need to query other sessions for this scenario)
    const isNewBest = true; // TODO: compare with previous sessions

    const summary: SessionSummary = {
      session,
      scenario_title: scenario.metadata.title,
      ending: {
        ending_id: endingData.ending_id,
        color: endingData.color,
        title: endingData.title,
        emoji: endingData.emoji,
        subtitle: endingData.subtitle,
        narrative: endingData.narrative,
        diagnosis: endingData.diagnosis,
      },
      choices_breakdown: choicesBreakdown,
      style_distribution: styleDistribution,
      is_new_best: isNewBest,
      post_game: {
        communication_style_summary: endingData.post_game?.communication_style_summary || scenario.post_game?.communication_style_summary || '',
        growth_tip: endingData.post_game?.growth_tip || scenario.post_game?.growth_tip || '',
        replay_prompt: endingData.post_game?.replay_prompt || scenario.post_game?.replay_prompt || '',
      },
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('GET /api/sessions/[id]/summary error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
