'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PROFILE_QUIZ, calculateProfileFromQuiz, TRAIT_NAMES } from '@/lib/engine/profile-quiz';
import { useProfileStore, useAuthStore } from '@/store/game-store';
import { getIdToken } from '@/lib/firebase/auth';
import { shuffleWithOriginalIndices } from '@/lib/utils/shuffle';

/**
 * Profile Quiz — 8 questions to build player's psychological profile.
 */
export default function QuizPage() {
  const router = useRouter();
  const setTraits = useProfileStore((s) => s.setTraits);
  const user = useAuthStore((s) => s.user);
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

        // Sync to Firestore if logged in
        if (user) {
          getIdToken().then(token => {
            if (!token) return;
            fetch('/api/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ traits: profile }),
            }).catch(() => { /* non-critical */ });
          });
        }

        router.push('/scenarios');
      } else {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
        setSelectedIdx(null);
      }
    }, 350);
  }, [selectedIdx, answers, currentQ, router, setTraits, user]);

  // Shuffle answers once per question (stable until player moves to next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledAnswers = useMemo(
    () => shuffleWithOriginalIndices(question.answers),
    [currentQ]
  );

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
          {shuffledAnswers.map(({ item: answer, originalIndex }, visualIndex) => (
            <div
              key={`${currentQ}-${originalIndex}`}
              className={`quiz-answer ${selectedIdx === originalIndex ? 'quiz-answer-selected' : ''}`}
              onClick={() => handleAnswer(originalIndex)}
            >
              {answer.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
