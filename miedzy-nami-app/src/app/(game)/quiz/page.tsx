'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PROFILE_QUIZ, calculateProfileFromQuiz, TRAIT_NAMES } from '@/lib/engine/profile-quiz';
import { useProfileStore } from '@/store/game-store';

/**
 * Profile Quiz — 8 questions to build player's psychological profile.
 */
export default function QuizPage() {
  const router = useRouter();
  const setTraits = useProfileStore((s) => s.setTraits);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const question = PROFILE_QUIZ[currentQ];
  const progress = (currentQ / PROFILE_QUIZ.length) * 100;

  const handleAnswer = useCallback((answerIndex: number) => {
    if (selectedIdx !== null) return; // prevent double-tap
    setSelectedIdx(answerIndex);

    const newAnswers = [...answers, answerIndex];

    setTimeout(() => {
      if (currentQ >= PROFILE_QUIZ.length - 1) {
        // Quiz complete — calculate and save profile
        const profile = calculateProfileFromQuiz(newAnswers);
        localStorage.setItem('mn_player_profile', JSON.stringify(profile));
        setTraits(profile);
        router.push('/scenarios');
      } else {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
        setSelectedIdx(null);
      }
    }, 350);
  }, [selectedIdx, answers, currentQ, router, setTraits]);

  return (
    <div className="screen fade-in">
      <div className="scroll-area">
        <div style={{ textAlign: 'center', padding: '30px 0 20px' }}>
          <h2 className="heading-display" style={{ fontSize: '1.5rem', marginBottom: 6 }}>
            Twój Profil Komunikacyjny
          </h2>
          <p className="text-secondary" style={{ fontSize: '0.88rem' }}>
            Pytanie {currentQ + 1} z {PROFILE_QUIZ.length}
          </p>
        </div>

        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: 20 }}>
          {question.question}
        </div>

        <div className="flex-col gap-md">
          {question.answers.map((answer, i) => (
            <div
              key={`${currentQ}-${i}`}
              className={`quiz-answer ${selectedIdx === i ? 'quiz-answer-selected' : ''}`}
              onClick={() => handleAnswer(i)}
            >
              {answer.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
