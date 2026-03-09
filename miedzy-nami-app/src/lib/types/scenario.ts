// ═══════════════════════════════════════════════════════════
//  SCENARIO JSON TYPES — Data Contract
//  These types match the JSON schema from the GDD exactly.
// ═══════════════════════════════════════════════════════════

export type RelationshipType =
  | 'romantic_partner' | 'parent_young_child' | 'parent_teenager'
  | 'teenager_parent' | 'child_parent' | 'parent_child' | 'siblings' | 'friends'
  | 'coworkers' | 'boss_employee' | 'employee_boss'
  | 'neighbors' | 'strangers' | 'ex_partners' | 'roommates';

export type Theme =
  | 'chores' | 'jealousy' | 'boundaries' | 'trust' | 'forgiveness'
  | 'stress' | 'money' | 'parenting' | 'intimacy' | 'romance'
  | 'criticism' | 'control' | 'neglect' | 'expectations' | 'independence'
  | 'support' | 'conflict_resolution' | 'apology' | 'change' | 'technology'
  | 'in_laws' | 'health' | 'loneliness' | 'respect' | 'responsibility'
  | 'communication_breakdown';

export type EmotionalIntensity = 'light' | 'moderate' | 'heavy' | 'critical';
export type AgeRating = 'all' | 'teen' | 'adult';
export type SessionType = 'quick_scene' | 'mini_story' | 'what_if' | 'role_swap' | 'training';
export type PlayerRoleGender = 'female' | 'male' | 'neutral';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type CommunicationStyle =
  | 'aggressive' | 'passive' | 'passive_aggressive'
  | 'assertive' | 'empathic' | 'transactional' | 'transformative';

export type Location =
  | 'living_room' | 'kitchen' | 'bedroom' | 'car' | 'office'
  | 'school' | 'street' | 'restaurant' | 'phone_call' | 'text_message';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type VisualMood = 'warm' | 'cold' | 'tense' | 'neutral' | 'dark' | 'hopeful';

export type HiddenNeed =
  | 'recognition' | 'safety' | 'autonomy' | 'support' | 'fairness' | 'being_seen';

export type EndingColor = 'red' | 'yellow' | 'green' | 'blue';

// ── Sub-types ──

export interface CharacterTrait {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface PsychologicalProfile {
  impulsiveness: number;  // 1-10
  patience: number;
  defensiveness: number;
  empathy: number;
  need_for_control: number;
  shame_sensitivity: number;
  directness: number;
  repair_ability: number;
}

export interface MetricEffects {
  tension: number;      // -3 to +3
  trust: number;
  openness: number;
  feeling_heard: number;
}

export interface Metrics {
  tension: number;      // 0-100
  trust: number;
  openness: number;
  feeling_heard: number;
}

export interface ChoiceTag {
  text: string;
  type: 'error' | 'skill' | 'concept';
}

// ── Main types ──

export interface ScenarioTags {
  relationship_type: RelationshipType;
  theme: Theme[];
  emotional_intensity: EmotionalIntensity;
  age_rating: AgeRating;
  session_type: SessionType;
  player_role_gender: PlayerRoleGender;
  difficulty: Difficulty;
}

export interface Character {
  name: string;
  role_label: string;
  age_range: string;
  context: string;
  hidden_need: HiddenNeed;
  hidden_need_text: string;
  traits: CharacterTrait[];
  profile: PsychologicalProfile;
}

export interface NPC extends Character {
  npc_reaction_logic: string;
}

export interface ChoiceFeedback {
  label: string;
  psychology: string;
  better_alternative_hint: string | null;
}

export interface Choice {
  choice_id: 'A' | 'B' | 'C' | 'D';
  text: string;
  points: 0 | 1 | 2;
  communication_style: CommunicationStyle;
  metric_effects: MetricEffects;
  npc_reaction: string;
  feedback: ChoiceFeedback;
  tags?: ChoiceTag[];
}

export interface Scene {
  description: string;
  location: Location;
  time_of_day: TimeOfDay;
  visual_mood: VisualMood;
}

export interface Interaction {
  interaction_id: string;
  title: string;

  // INT_1 uses single scene:
  scene?: Scene;
  npc_line?: string | null;

  // INT_2+ can use dynamic variants based on accumulated score:
  score_threshold?: number;
  scene_low?: Scene;
  scene_high?: Scene;
  npc_line_low?: string | null;
  npc_line_high?: string | null;

  npc_stage_direction?: string | null;
  choices: [Choice, Choice, Choice, Choice]; // exactly 4
}

export interface ScoreRange {
  min: number;
  max: number;
}

export interface Ending {
  ending_id: string;
  score_range: ScoreRange;
  color: EndingColor;
  title: string;
  emoji?: string;
  subtitle?: string;
  narrative: string;
  diagnosis: string;
  post_game?: PostGame;
}

export interface PostGame {
  communication_style_summary: string;
  strongest_moment: string;
  growth_tip: string;
  replay_prompt: string;
}

export interface ScenarioMetadata {
  title: string;
  subtitle: string;
  author: string;
  created_at: string;
  estimated_duration_minutes: number;
  interaction_count: number;
}

export interface Scenario {
  scenario_id: string;
  version: string;
  language: string;

  metadata: ScenarioMetadata;
  tags: ScenarioTags;

  characters: {
    player: Character;
    npc: NPC;
  };

  metrics_start: Metrics;
  interactions: Interaction[];
  endings: Ending[];
  post_game?: PostGame;
}

// ── Scenario catalog entry (lighter, for listings) ──

export interface ScenarioCatalogEntry {
  scenario_id: string;
  metadata: ScenarioMetadata;
  tags: ScenarioTags;
  is_free: boolean;
  unlock_requirements?: {
    min_sessions?: number;
    required_scenarios?: string[];
  };
  play_count: number;
  average_score: number;
  // Added by client based on user data
  completed?: boolean;
  locked?: boolean;
  best_score?: number | null;
}
