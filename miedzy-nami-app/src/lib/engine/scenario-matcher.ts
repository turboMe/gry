// ═══════════════════════════════════════════════════════════
//  SCENARIO MATCHER
//  Filters, sorts, and recommends scenarios for a player.
// ═══════════════════════════════════════════════════════════

import type {
  ScenarioCatalogEntry,
  RelationshipType, Theme, Difficulty,
  SessionType, AgeRating,
  PsychologicalProfile,
} from '@/lib/types';

export interface ScenarioFilters {
  relationship_type?: RelationshipType;
  theme?: Theme;
  difficulty?: Difficulty;
  session_type?: SessionType;
  age_rating?: AgeRating;
  search?: string;
  show_locked?: boolean;
  show_completed?: boolean;
}

/**
 * Filter scenarios based on provided filters.
 */
export function filterScenarios(
  scenarios: ScenarioCatalogEntry[],
  filters: ScenarioFilters
): ScenarioCatalogEntry[] {
  return scenarios.filter(s => {
    // Relationship type filter
    if (filters.relationship_type && s.tags.relationship_type !== filters.relationship_type) {
      return false;
    }

    // Theme filter
    if (filters.theme && !s.tags.theme.includes(filters.theme)) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty && s.tags.difficulty !== filters.difficulty) {
      return false;
    }

    // Session type filter
    if (filters.session_type && s.tags.session_type !== filters.session_type) {
      return false;
    }

    // Age rating filter
    if (filters.age_rating && s.tags.age_rating !== filters.age_rating) {
      return false;
    }

    // Hide locked unless explicitly requested
    if (!filters.show_locked && s.locked) {
      return false;
    }

    // Text search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = s.metadata.title.toLowerCase().includes(q);
      const matchSubtitle = s.metadata.subtitle.toLowerCase().includes(q);
      if (!matchTitle && !matchSubtitle) return false;
    }

    return true;
  });
}

/**
 * Sort scenarios: difficulty ASC, then popularity DESC.
 */
export function sortScenarios(scenarios: ScenarioCatalogEntry[]): ScenarioCatalogEntry[] {
  const difficultyOrder: Record<Difficulty, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
    expert: 3,
  };

  return [...scenarios].sort((a, b) => {
    // Free first, then premium
    if (a.is_free !== b.is_free) return a.is_free ? -1 : 1;

    // Difficulty ASC
    const dA = difficultyOrder[a.tags.difficulty] ?? 0;
    const dB = difficultyOrder[b.tags.difficulty] ?? 0;
    if (dA !== dB) return dA - dB;

    // Popularity DESC
    return b.play_count - a.play_count;
  });
}

/**
 * Group scenarios by relationship type for category view.
 */
export function groupByRelationship(
  scenarios: ScenarioCatalogEntry[]
): Record<string, ScenarioCatalogEntry[]> {
  const groups: Record<string, ScenarioCatalogEntry[]> = {};
  for (const s of scenarios) {
    const rt = s.tags.relationship_type;
    if (!groups[rt]) groups[rt] = [];
    groups[rt].push(s);
  }
  return groups;
}

// ── Trait weakness labels (for recommendations) ──

const TRAIT_SCENARIO_THEMES: Record<keyof PsychologicalProfile, Theme[]> = {
  impulsiveness: ['conflict_resolution', 'stress', 'criticism'],
  patience: ['chores', 'expectations', 'technology'],
  defensiveness: ['criticism', 'boundaries', 'trust'],
  empathy: ['support', 'loneliness', 'neglect'],
  need_for_control: ['control', 'independence', 'boundaries'],
  shame_sensitivity: ['apology', 'forgiveness', 'respect'],
  directness: ['communication_breakdown', 'expectations', 'boundaries'],
  repair_ability: ['forgiveness', 'apology', 'conflict_resolution'],
};

/**
 * Recommend scenarios that target a player's weakest traits.
 * Returns scenarios whose themes align with the player's lowest-scoring traits.
 */
export function recommendScenarios(
  scenarios: ScenarioCatalogEntry[],
  profile: PsychologicalProfile,
  limit: number = 5
): ScenarioCatalogEntry[] {
  // Find weakest traits (lowest values)
  const traitEntries = Object.entries(profile) as [keyof PsychologicalProfile, number][];
  const sorted = traitEntries.sort((a, b) => a[1] - b[1]);
  const weakTraits = sorted.slice(0, 3).map(([trait]) => trait);

  // Collect relevant themes
  const targetThemes = new Set<Theme>();
  for (const trait of weakTraits) {
    const themes = TRAIT_SCENARIO_THEMES[trait] || [];
    themes.forEach(t => targetThemes.add(t));
  }

  // Score scenarios by theme overlap
  const scored = scenarios
    .filter(s => !s.locked && !s.completed)
    .map(s => {
      const overlap = s.tags.theme.filter(t => targetThemes.has(t)).length;
      return { scenario: s, score: overlap };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(x => x.scenario);
}

/**
 * Relationship type categories with icons, images, and Polish names.
 */
export const RELATIONSHIP_CATEGORIES: Record<RelationshipType, { icon: string; name: string; image?: string }> = {
  romantic_partner: { icon: '💑', name: 'Związek', image: '/icons/categories/romantic_partner.png' },
  parent_young_child: { icon: '👨‍👧', name: 'Rodzic → małe dziecko' },
  parent_teenager: { icon: '👨‍👧‍👦', name: 'Rodzic → nastolatek' },
  teenager_parent: { icon: '🧑‍🤝‍🧑', name: 'Nastolatek → rodzic' },
  child_parent: { icon: '👨‍👩‍👦', name: 'Dziecko → rodzic' },
  parent_child: { icon: '👨‍👧', name: 'Rodzic i dziecko', image: '/icons/categories/parent_child.png' },
  siblings: { icon: '👫', name: 'Rodzeństwo', image: '/icons/categories/siblings.png' },
  friends: { icon: '🤝', name: 'Przyjaciele', image: '/icons/categories/friends.png' },
  coworkers: { icon: '💼', name: 'Współpracownicy', image: '/icons/categories/coworkers.png' },
  boss_employee: { icon: '👔', name: 'Szef → pracownik' },
  employee_boss: { icon: '🙋', name: 'Pracownik → szef' },
  neighbors: { icon: '🏘️', name: 'Sąsiedzi' },
  strangers: { icon: '👥', name: 'Obcy' },
  ex_partners: { icon: '💔', name: 'Byli partnerzy' },
  roommates: { icon: '🏠', name: 'Współlokatorzy', image: '/icons/categories/roommates.png' },
};
