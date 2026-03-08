// ═══════════════════════════════════════════════════════════
//  TAG VALIDATOR
//  Validates scenario JSON structure and tag compatibility.
//  Used both server-side (API upload) and client-side.
// ═══════════════════════════════════════════════════════════

import type { Scenario, ScenarioTags, RelationshipType, Theme } from '@/lib/types';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ── Valid enums ──

const VALID_RELATIONSHIP_TYPES: RelationshipType[] = [
  'romantic_partner', 'parent_young_child', 'parent_teenager',
  'teenager_parent', 'child_parent', 'siblings', 'friends',
  'coworkers', 'boss_employee', 'employee_boss',
  'neighbors', 'strangers', 'ex_partners',
];

const VALID_THEMES: Theme[] = [
  'chores', 'jealousy', 'boundaries', 'trust', 'forgiveness',
  'stress', 'money', 'parenting', 'intimacy', 'romance',
  'criticism', 'control', 'neglect', 'expectations', 'independence',
  'support', 'conflict_resolution', 'apology', 'change', 'technology',
  'in_laws', 'health', 'loneliness', 'respect', 'responsibility',
  'communication_breakdown',
];

const VALID_INTENSITIES = ['light', 'moderate', 'heavy', 'critical'] as const;
const VALID_AGE_RATINGS = ['all', 'teen', 'adult'] as const;
const VALID_SESSION_TYPES = ['quick_scene', 'mini_story', 'what_if', 'role_swap', 'training'] as const;
const VALID_GENDERS = ['female', 'male', 'neutral'] as const;
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const VALID_STYLES = ['aggressive', 'passive', 'passive_aggressive', 'assertive', 'empathic', 'transactional', 'transformative'] as const;

// ── Hard compatibility blocks ──

const PARENTAL_TYPES: RelationshipType[] = [
  'parent_young_child', 'parent_teenager', 'teenager_parent', 'child_parent'
];

const ROMANTIC_THEMES: Theme[] = ['romance', 'intimacy'];
const ROMANTIC_RELATIONSHIPS: RelationshipType[] = ['romantic_partner', 'ex_partners'];

/**
 * Check tag compatibility — hard blocks that reject a scenario.
 */
export function checkTagCompatibility(tags: ScenarioTags): ValidationError[] {
  const errors: ValidationError[] = [];
  const rt = tags.relationship_type;
  const themes = tags.theme || [];

  // 1. parent/teenager + romance/intimacy → REJECT
  if (['parent_young_child', 'parent_teenager', 'teenager_parent'].includes(rt)) {
    if (themes.some(t => ROMANTIC_THEMES.includes(t))) {
      errors.push({
        field: 'tags',
        message: `Relacja "${rt}" nie może mieć tematu romance/intimacy`,
        severity: 'error',
      });
    }
  }

  // 2. siblings + romance/intimacy → REJECT
  if (rt === 'siblings' && themes.some(t => ROMANTIC_THEMES.includes(t))) {
    errors.push({
      field: 'tags',
      message: 'Relacja "siblings" nie może mieć tematu romance/intimacy',
      severity: 'error',
    });
  }

  // 3. child/teenager relationships + adult rating → REJECT
  if (PARENTAL_TYPES.includes(rt) && tags.age_rating === 'adult') {
    errors.push({
      field: 'tags',
      message: `Relacja "${rt}" nie może mieć ratingu "adult"`,
      severity: 'error',
    });
  }

  // 4. romance/intimacy theme only for romantic_partner/ex_partners
  if (themes.some(t => ROMANTIC_THEMES.includes(t)) && !ROMANTIC_RELATIONSHIPS.includes(rt)) {
    errors.push({
      field: 'tags',
      message: 'Tematy romance/intimacy dozwolone tylko dla romantic_partner/ex_partners',
      severity: 'error',
    });
  }

  // 5. critical intensity + all age rating → REJECT
  if (tags.emotional_intensity === 'critical' && tags.age_rating === 'all') {
    errors.push({
      field: 'tags',
      message: 'Intensywność "critical" nie może mieć ratingu "all"',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * Full scenario validation — structure + tags + score ranges.
 */
export function validateScenario(scenario: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Type guard
  if (!scenario || typeof scenario !== 'object') {
    errors.push({ field: 'root', message: 'Scenariusz musi być obiektem JSON', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  const s = scenario as Record<string, unknown>;

  // ── Required top-level fields ──
  const requiredFields = ['scenario_id', 'version', 'language', 'metadata', 'tags', 'characters', 'metrics_start', 'interactions', 'endings'];
  for (const field of requiredFields) {
    if (!(field in s)) {
      errors.push({ field, message: `Brakujące pole: ${field}`, severity: 'error' });
    }
  }
  if (errors.length > 0) return { valid: false, errors, warnings };

  // ── Tags validation ──
  const tags = s.tags as Record<string, unknown>;
  if (tags) {
    if (!VALID_RELATIONSHIP_TYPES.includes(tags.relationship_type as RelationshipType)) {
      errors.push({ field: 'tags.relationship_type', message: `Nieprawidłowy typ relacji: ${tags.relationship_type}`, severity: 'error' });
    }
    const themes = tags.theme as string[];
    if (!Array.isArray(themes) || themes.length < 1 || themes.length > 3) {
      errors.push({ field: 'tags.theme', message: 'Theme musi być tablicą 1-3 elementów', severity: 'error' });
    } else {
      for (const t of themes) {
        if (!VALID_THEMES.includes(t as Theme)) {
          errors.push({ field: 'tags.theme', message: `Nieprawidłowy temat: ${t}`, severity: 'error' });
        }
      }
    }
    if (!VALID_INTENSITIES.includes(tags.emotional_intensity as typeof VALID_INTENSITIES[number])) {
      errors.push({ field: 'tags.emotional_intensity', message: `Nieprawidłowa intensywność`, severity: 'error' });
    }
    if (!VALID_AGE_RATINGS.includes(tags.age_rating as typeof VALID_AGE_RATINGS[number])) {
      errors.push({ field: 'tags.age_rating', message: `Nieprawidłowy rating`, severity: 'error' });
    }
    if (!VALID_SESSION_TYPES.includes(tags.session_type as typeof VALID_SESSION_TYPES[number])) {
      errors.push({ field: 'tags.session_type', message: `Nieprawidłowy typ sesji`, severity: 'error' });
    }
    if (!VALID_GENDERS.includes(tags.player_role_gender as typeof VALID_GENDERS[number])) {
      errors.push({ field: 'tags.player_role_gender', message: `Nieprawidłowa płeć roli`, severity: 'error' });
    }
    if (!VALID_DIFFICULTIES.includes(tags.difficulty as typeof VALID_DIFFICULTIES[number])) {
      errors.push({ field: 'tags.difficulty', message: `Nieprawidłowy poziom trudności`, severity: 'error' });
    }

    // Tag compatibility check
    if (errors.length === 0) {
      const compatErrors = checkTagCompatibility(tags as unknown as ScenarioTags);
      errors.push(...compatErrors);
    }
  }

  // ── Interactions validation ──
  const interactions = s.interactions as Array<Record<string, unknown>>;
  if (Array.isArray(interactions)) {
    if (interactions.length < 3) {
      errors.push({ field: 'interactions', message: 'Scenariusz musi mieć minimum 3 interakcje', severity: 'error' });
    }

    for (let i = 0; i < interactions.length; i++) {
      const int = interactions[i];
      const choices = int.choices as Array<Record<string, unknown>>;

      if (!Array.isArray(choices) || choices.length !== 4) {
        errors.push({
          field: `interactions[${i}].choices`,
          message: `Interakcja ${int.interaction_id} musi mieć dokładnie 4 opcje`,
          severity: 'error',
        });
        continue;
      }

      // Max 1 choice worth 2 points per interaction
      const twoPointChoices = choices.filter(c => c.points === 2);
      if (twoPointChoices.length > 1) {
        errors.push({
          field: `interactions[${i}].choices`,
          message: `Interakcja ${int.interaction_id}: max 1 odpowiedź za 2 punkty`,
          severity: 'error',
        });
      }

      // Validate communication styles
      for (const choice of choices) {
        if (!VALID_STYLES.includes(choice.communication_style as typeof VALID_STYLES[number])) {
          warnings.push({
            field: `interactions[${i}].choices.${choice.choice_id}`,
            message: `Nierozpoznany styl komunikacji: ${choice.communication_style}`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // ── Endings validation — score ranges must cover full 0 to max ──
  const endings = s.endings as Array<Record<string, unknown>>;
  if (Array.isArray(endings) && Array.isArray(interactions)) {
    const maxScore = interactions.length * 2;
    const ranges = endings.map(e => {
      const range = e.score_range as { min: number; max: number };
      return range;
    }).sort((a, b) => a.min - b.min);

    if (ranges.length > 0) {
      if (ranges[0].min !== 0) {
        errors.push({ field: 'endings', message: `Score range nie zaczyna się od 0 (zaczyna od ${ranges[0].min})`, severity: 'error' });
      }
      if (ranges[ranges.length - 1].max < maxScore) {
        errors.push({ field: 'endings', message: `Score range nie pokrywa max score ${maxScore} (kończy na ${ranges[ranges.length - 1].max})`, severity: 'error' });
      }

      // Check for gaps
      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].min > ranges[i - 1].max + 1) {
          errors.push({ field: 'endings', message: `Luka w score ranges: ${ranges[i - 1].max} → ${ranges[i].min}`, severity: 'error' });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
