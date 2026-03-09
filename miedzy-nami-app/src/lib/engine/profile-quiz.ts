// ═══════════════════════════════════════════════════════════
//  PROFILE QUIZ DATA — 8 questions for psychological profile
//  Migrated from prototype index.html
// ═══════════════════════════════════════════════════════════

import type { PsychologicalProfile } from '@/lib/types';

export interface QuizAnswer {
  text: string;
  effects: Partial<Record<keyof PsychologicalProfile, number>>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export const PROFILE_QUIZ: QuizQuestion[] = [
  {
    id: 'q1_criticism',
    question: 'Kiedy ktoś cię krytykuje, zwykle:',
    answers: [
      { text: 'Od razu odpowiadam ostro, bronię się', effects: { impulsiveness: 2, defensiveness: 1 } },
      { text: 'Bronię się, tłumacząc swoją rację spokojnie', effects: { defensiveness: 2 } },
      { text: 'Wycofuję się i milczę, choć w środku kipi', effects: { directness: -2, shame_sensitivity: 1 } },
      { text: 'Słucham i pytam, co konkretnie mają na myśli', effects: { empathy: 2, repair_ability: 1 } },
    ],
  },
  {
    id: 'q2_fatigue',
    question: 'Gdy jesteś zmęczony/a, a ktoś zaczyna trudną rozmowę:',
    answers: [
      { text: 'Wybucham szybciej niż zwykle', effects: { impulsiveness: 2, patience: -1 } },
      { text: 'Proszę o przełożenie rozmowy na później', effects: { patience: 2, directness: 1 } },
      { text: 'Udaję, że wszystko OK, żeby uniknąć konfliktu', effects: { directness: -2, patience: 1 } },
      { text: 'Staram się słuchać, choć jest mi ciężko', effects: { empathy: 1, patience: 1 } },
    ],
  },
  {
    id: 'q3_conflict',
    question: 'W konflikcie ważniejsze jest dla ciebie:',
    answers: [
      { text: 'Postawić na swoim — mam rację i to się liczy', effects: { need_for_control: 2, empathy: -1 } },
      { text: 'Znaleźć kompromis, nawet kosztem swoich potrzeb', effects: { empathy: 1, directness: -1 } },
      { text: 'Żeby druga osoba zrozumiała, jak się czuję', effects: { shame_sensitivity: 1, empathy: 1 } },
      { text: 'Wspólnie znaleźć rozwiązanie, które pasuje obu stronom', effects: { repair_ability: 2, empathy: 1 } },
    ],
  },
  {
    id: 'q4_apology',
    question: 'Kiedy zrobiłeś/aś komuś przykrość, zwykle:',
    answers: [
      { text: 'Trudno mi przeprosić — czuję wstyd i uciekam', effects: { repair_ability: -2, shame_sensitivity: 2 } },
      { text: 'Przepraszam szybko, żeby temat zamknąć', effects: { repair_ability: 1, directness: 1 } },
      { text: 'Tłumaczę dlaczego tak zrobiłem/am (bo miałem powody)', effects: { defensiveness: 2, repair_ability: -1 } },
      { text: 'Przepraszam i pytam, jak mogę to naprawić', effects: { repair_ability: 2, empathy: 1 } },
    ],
  },
  {
    id: 'q5_behavior',
    question: 'Gdy ktoś bliski zachowuje się nie tak, jak chcesz:',
    answers: [
      { text: 'Mówię wprost co mi się nie podoba, nawet ostro', effects: { directness: 2, need_for_control: 1 } },
      { text: 'Sugeruję delikatnie, nie chcę ranić', effects: { directness: -1, empathy: 1 } },
      { text: 'Robię „pod nosem" uwagi albo milczę wymownie', effects: { directness: -2, need_for_control: 1 } },
      { text: 'Opisuję swoje uczucia i proszę o zmianę', effects: { directness: 1, repair_ability: 1 } },
    ],
  },
  {
    id: 'q6_judgment',
    question: 'Gdy ktoś ocenia twój wygląd lub styl życia:',
    answers: [
      { text: 'Bierze mnie to bardzo mocno, długo o tym myślę', effects: { shame_sensitivity: 2, defensiveness: 1 } },
      { text: 'Irytuje mnie to, ale staram się nie reagować', effects: { patience: 1, shame_sensitivity: 1 } },
      { text: 'Odpowiadam ripostą — niech też poczują', effects: { impulsiveness: 2, defensiveness: 1 } },
      { text: 'Zastanawiam się, czy jest w tym ziarno prawdy', effects: { empathy: 1, shame_sensitivity: -1 } },
    ],
  },
  {
    id: 'q7_planning',
    question: 'Twoje podejście do planowania i porządku:',
    answers: [
      { text: 'Lubię mieć kontrolę, denerwuje mnie chaos', effects: { need_for_control: 2, patience: -1 } },
      { text: 'Jestem elastyczny/a, dostosowuję się', effects: { need_for_control: -1, patience: 1 } },
      { text: 'Planuję, ale nie stresuję się zmianami', effects: { patience: 2 } },
      { text: 'Spontaniczność to moja mocna strona', effects: { impulsiveness: 1, need_for_control: -2 } },
    ],
  },
  {
    id: 'q8_aftermath',
    question: 'Po kłótni z bliską osobą zwykle:',
    answers: [
      { text: 'Potrzebuję dużo czasu, żeby się uspokoić', effects: { impulsiveness: -1, repair_ability: -1 } },
      { text: 'Szybko wracam do normalności i próbuję naprawić', effects: { repair_ability: 2 } },
      { text: 'Czekam, aż druga osoba zrobi pierwszy krok', effects: { directness: -1, defensiveness: 1 } },
      { text: 'Analizuję co poszło nie tak i wyciągam wnioski', effects: { empathy: 1, repair_ability: 1 } },
    ],
  },
];

/**
 * Calculate a psychological profile from quiz answers.
 * @param answers Array of answer indices (0-3) for each question.
 */
export function calculateProfileFromQuiz(answers: number[]): PsychologicalProfile {
  const profile: PsychologicalProfile = {
    impulsiveness: 5,
    patience: 5,
    defensiveness: 5,
    empathy: 5,
    need_for_control: 5,
    shame_sensitivity: 5,
    directness: 5,
    repair_ability: 5,
  };

  answers.forEach((answerIndex, questionIndex) => {
    const question = PROFILE_QUIZ[questionIndex];
    if (!question) return;

    const answer = question.answers[answerIndex];
    if (!answer) return;

    for (const [trait, delta] of Object.entries(answer.effects)) {
      const key = trait as keyof PsychologicalProfile;
      profile[key] = Math.max(1, Math.min(10, profile[key] + (delta as number)));
    }
  });

  return profile;
}

/**
 * Trait display names (Polish)
 */
export const TRAIT_NAMES: Record<keyof PsychologicalProfile, string> = {
  impulsiveness: 'Impulsywność',
  patience: 'Cierpliwość',
  defensiveness: 'Defensywność',
  empathy: 'Empatia',
  need_for_control: 'Potrzeba kontroli',
  shame_sensitivity: 'Wrażliwość na wstyd',
  directness: 'Bezpośredniość',
  repair_ability: 'Zdolność naprawy',
};

/** Traits where higher = better (resources) */
export const POSITIVE_TRAITS: (keyof PsychologicalProfile)[] = [
  'empathy', 'patience', 'directness', 'repair_ability',
];

/** Traits where lower = better (barriers to work on) */
export const NEGATIVE_TRAITS: (keyof PsychologicalProfile)[] = [
  'impulsiveness', 'defensiveness', 'need_for_control', 'shame_sensitivity',
];

