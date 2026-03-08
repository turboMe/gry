// ═══════════════════════════════════════════════════════════
//  ZUSTAND GAME STORE
//  Central state management for the game client.
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type {
  Scenario, Metrics, ScenarioCatalogEntry,
  PsychologicalProfile, CommunicationStyle,
} from '@/lib/types';
import type { ChoiceRecord, GameSession, ChoiceResult } from '@/lib/types/session';
import type { User as FirebaseUser } from 'firebase/auth';

// ── Auth State ──

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
}));

// ── Profile State ──

interface ProfileState {
  traits: PsychologicalProfile | null;
  quizCompleted: boolean;
  loading: boolean;
  setTraits: (traits: PsychologicalProfile) => void;
  setQuizCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  traits: null,
  quizCompleted: false,
  loading: true,
  setTraits: (traits) => set({ traits, quizCompleted: true }),
  setQuizCompleted: (completed) => set({ quizCompleted: completed }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ traits: null, quizCompleted: false }),
}));

// ── Game State ──

type GamePhase =
  | 'IDLE'
  | 'CHARACTER_INTRO'
  | 'SCENE_INTRO'
  | 'NPC_SPEAKS'
  | 'PLAYER_CHOOSING'
  | 'CHOICE_ANIMATION'
  | 'NPC_REACTS'
  | 'FEEDBACK_PANEL'
  | 'ENDING'
  | 'SUMMARY';

interface GameState {
  // Session
  sessionId: string | null;
  scenario: Scenario | null;
  currentInteractionIndex: number;
  phase: GamePhase;

  // Metrics & scoring
  metrics: Metrics;
  totalScore: number;
  maxPossibleScore: number;
  choicesMade: ChoiceRecord[];

  // Last choice result (from API)
  lastChoiceResult: ChoiceResult | null;

  // Actions
  startGame: (sessionId: string, scenario: Scenario) => void;
  setPhase: (phase: GamePhase) => void;
  applyChoiceResult: (result: ChoiceResult) => void;
  nextInteraction: () => void;
  resetGame: () => void;
}

const INITIAL_METRICS: Metrics = { tension: 50, trust: 50, openness: 50, feeling_heard: 50 };

export const useGameStore = create<GameState>((set) => ({
  sessionId: null,
  scenario: null,
  currentInteractionIndex: 0,
  phase: 'IDLE',
  metrics: INITIAL_METRICS,
  totalScore: 0,
  maxPossibleScore: 0,
  choicesMade: [],
  lastChoiceResult: null,

  startGame: (sessionId, scenario) => set({
    sessionId,
    scenario,
    currentInteractionIndex: 0,
    phase: 'CHARACTER_INTRO',
    metrics: { ...scenario.metrics_start },
    totalScore: 0,
    maxPossibleScore: scenario.interactions.length * 2,
    choicesMade: [],
    lastChoiceResult: null,
  }),

  setPhase: (phase) => set({ phase }),

  applyChoiceResult: (result) => set((state) => ({
    metrics: result.metrics_updated,
    totalScore: result.total_score,
    choicesMade: [...state.choicesMade, result.choice_record],
    lastChoiceResult: result,
    phase: 'NPC_REACTS',
  })),

  nextInteraction: () => set((state) => ({
    currentInteractionIndex: state.currentInteractionIndex + 1,
    phase: 'SCENE_INTRO',
    lastChoiceResult: null,
  })),

  resetGame: () => set({
    sessionId: null,
    scenario: null,
    currentInteractionIndex: 0,
    phase: 'IDLE',
    metrics: INITIAL_METRICS,
    totalScore: 0,
    maxPossibleScore: 0,
    choicesMade: [],
    lastChoiceResult: null,
  }),
}));

// ── Scenario Browser State ──

interface ScenarioState {
  scenarios: ScenarioCatalogEntry[];
  selectedCategory: string | null;
  loading: boolean;
  setScenarios: (scenarios: ScenarioCatalogEntry[]) => void;
  setSelectedCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  selectedCategory: null,
  loading: true,
  setScenarios: (scenarios) => set({ scenarios, loading: false }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setLoading: (loading) => set({ loading }),
}));
