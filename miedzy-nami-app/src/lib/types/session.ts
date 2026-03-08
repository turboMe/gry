// ═══════════════════════════════════════════════════════════
//  GAME SESSION TYPES
// ═══════════════════════════════════════════════════════════

import type { Metrics, MetricEffects, CommunicationStyle, EndingColor } from './scenario';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ChoiceRecord {
  interaction_id: string;
  choice_id: 'A' | 'B' | 'C' | 'D';
  choice_index: number;
  points: number;
  communication_style: CommunicationStyle;
  metric_effects_applied: MetricEffects;
}

export interface GameSession {
  session_id: string;
  user_id: string;
  scenario_id: string;
  started_at: string;
  completed_at: string | null;
  status: SessionStatus;
  current_interaction_index: number;
  choices: ChoiceRecord[];
  metrics_current: Metrics;
  metrics_final: Metrics | null;
  total_score: number;
  max_possible_score: number;
  ending_id: string | null;
  ending_color: EndingColor | null;
  dominant_communication_style: CommunicationStyle | null;
}

// ── API response after making a choice ──

export interface ChoiceResult {
  choice_record: ChoiceRecord;
  npc_reaction: string;
  feedback: {
    label: string;
    psychology: string;
    better_alternative_hint: string | null;
  };
  metrics_updated: Metrics;
  total_score: number;
  is_last_interaction: boolean;
  ending?: {
    ending_id: string;
    color: EndingColor;
    title: string;
    emoji?: string;
    subtitle?: string;
    narrative: string;
    diagnosis: string;
    post_game?: {
      communication_style_summary: string;
      strongest_moment: string;
      growth_tip: string;
      replay_prompt: string;
    };
  };
  all_choices_revealed: Array<{
    choice_id: string;
    points: number;
    communication_style: CommunicationStyle;
  }>;
}

// ── Session summary (post-game) ──

export interface SessionSummary {
  session: GameSession;
  scenario_title: string;
  ending: {
    ending_id: string;
    color: EndingColor;
    title: string;
    emoji?: string;
    subtitle?: string;
    narrative: string;
    diagnosis: string;
  };
  choices_breakdown: Array<{
    interaction_title: string;
    chosen: ChoiceRecord;
    best_choice_id: string;
  }>;
  style_distribution: Partial<Record<CommunicationStyle, number>>;
  is_new_best: boolean;
  post_game: {
    communication_style_summary: string;
    growth_tip: string;
    replay_prompt: string;
  };
}
