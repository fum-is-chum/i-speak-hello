import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserSettings, Word, QuizQuestion } from '@i-speak-hello/shared';
import { buildQuizSession } from '../../src/lib/quiz-engine';
import { recordQuizAnswer } from '../../src/lib/quiz-helpers';

interface Props {
  settings: UserSettings;
  words: Word[];
  hostname: string;
  onUnlock: () => void;
}

/**
 * Detect if dark mode should be used based on settings + system preference.
 */
function useDarkMode(theme: string): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (theme !== 'system') {
      setIsDark(theme === 'dark');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    setIsDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return isDark;
}

export function SiteBlockerOverlay({ settings, words, hostname, onUnlock }: Props) {
  const questionsNeeded = settings.siteBlocker.questionsToUnlock;
  const skipCooldown = settings.siteBlocker.skipCooldownSeconds;
  const isDark = useDarkMode(settings.theme);

  // Build quiz using the shared quiz engine (only MCQ + flashcard for site blocker)
  const [questions] = useState<QuizQuestion[]>(() =>
    buildQuizSession(words, ['mcq', 'flashcard'], questionsNeeded, 0, 0)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [skipTimer, setSkipTimer] = useState(skipCooldown);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [pinyinRevealed, setPinyinRevealed] = useState(false);

  // Color palette based on dark/light mode
  const colors = useMemo(() => isDark ? {
    overlay: 'rgba(0, 0, 0, 0.9)',
    cardBg: '#1f2937',
    cardText: '#f9fafb',
    subtitleText: '#9ca3af',
    accentText: '#818cf8',
    pinyinText: '#a5b4fc',
    dotInactive: '#374151',
    dotActive: '#22c55e',
    dotCurrent: '#6366f1',
    optionBg: '#374151',
    optionBorder: '#4b5563',
    optionText: '#e5e7eb',
    correctBg: '#065f46',
    correctBorder: '#22c55e',
    correctText: '#a7f3d0',
    wrongBg: '#7f1d1d',
    wrongBorder: '#ef4444',
    wrongText: '#fecaca',
    fadedBg: '#1f2937',
    fadedBorder: '#374151',
    fadedText: '#6b7280',
    flashcardFront: '#374151',
    flashcardBack: 'linear-gradient(135deg, #4338ca, #6d28d9)',
    flashcardHint: '#9ca3af',
    skipText: '#6b7280',
    skipBorder: '#4b5563',
    skipBg: 'transparent',
  } : {
    overlay: 'rgba(0, 0, 0, 0.85)',
    cardBg: 'white',
    cardText: '#111827',
    subtitleText: '#9ca3af',
    accentText: '#6366f1',
    pinyinText: '#6366f1',
    dotInactive: '#e5e7eb',
    dotActive: '#22c55e',
    dotCurrent: '#6366f1',
    optionBg: '#f9fafb',
    optionBorder: '#e5e7eb',
    optionText: '#374151',
    correctBg: '#f0fdf4',
    correctBorder: '#22c55e',
    correctText: '#166534',
    wrongBg: '#fef2f2',
    wrongBorder: '#ef4444',
    wrongText: '#991b1b',
    fadedBg: '#f9fafb',
    fadedBorder: '#e5e7eb',
    fadedText: '#9ca3af',
    flashcardFront: '#f9fafb',
    flashcardBack: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    flashcardHint: '#9ca3af',
    skipText: '#9ca3af',
    skipBorder: '#e5e7eb',
    skipBg: 'transparent',
  }, [isDark]);

  // Skip countdown timer
  useEffect(() => {
    if (skipCooldown <= 0) return;
    if (skipTimer <= 0) return;
    const interval = setInterval(() => {
      setSkipTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [skipCooldown, skipTimer]);

  const advanceToNext = useCallback((nextAnswered: number) => {
    if (nextAnswered >= questionsNeeded) {
      onUnlock();
    } else if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setFlipped(false);
      setPinyinRevealed(false);
    } else {
      onUnlock();
    }
  }, [currentIdx, questions.length, questionsNeeded, onUnlock]);

  const handleMCQSelect = useCallback((option: string) => {
    if (showResult) return;
    const q = questions[currentIdx];
    setSelectedAnswer(option);
    setShowResult(true);

    const isCorrect = option === q.word.translation;

    // Use shared helper for SRS + streak (fire-and-forget)
    recordQuizAnswer(q.word, isCorrect ? 4 : 1, 'mcq');

    setTimeout(() => {
      const nextAnswered = answered + 1;
      setAnswered(nextAnswered);
      advanceToNext(nextAnswered);
    }, 1200);
  }, [showResult, questions, currentIdx, answered, advanceToNext]);

  const handleFlashcardRate = useCallback((quality: number) => {
    const q = questions[currentIdx];

    // Use shared helper for SRS + streak (fire-and-forget)
    recordQuizAnswer(q.word, quality, 'flashcard');

    const nextAnswered = answered + 1;
    setAnswered(nextAnswered);
    advanceToNext(nextAnswered);
  }, [questions, currentIdx, answered, advanceToNext]);

  const question = questions[currentIdx];
  if (!question) {
    onUnlock();
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2147483647,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.overlay,
      backdropFilter: 'blur(12px)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: colors.cardBg,
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '90%',
        textAlign: 'center',
        boxShadow: isDark
          ? '0 25px 60px rgba(0,0,0,0.5)'
          : '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '8px', fontSize: '14px', color: colors.subtitleText }}>
          🌏 I Speak Hello
        </div>
        <div style={{ marginBottom: '4px', fontSize: '13px', color: colors.accentText, fontWeight: 600 }}>
          Site Quiz — jawab {questionsNeeded} pertanyaan untuk membuka {hostname}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '16px 0 24px' }}>
          {Array.from({ length: questionsNeeded }).map((_, i) => (
            <div key={i} style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i < answered ? colors.dotActive : i === answered ? colors.dotCurrent : colors.dotInactive,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Question */}
        {question.quizType === 'mcq' ? (
          <div>
            <div style={{ fontSize: '13px', color: colors.subtitleText, marginBottom: '8px' }}>
              {question.word.targetLanguage === 'zh' ? '🇨🇳' : '🇬🇧'} Apa arti kata ini?
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: colors.cardText, marginBottom: '4px' }}>
              {question.word.original}
            </div>
            {question.word.pinyin && (
              <div
                onClick={() => setPinyinRevealed(true)}
                style={{
                  fontSize: '16px',
                  color: colors.pinyinText,
                  marginBottom: '20px',
                  filter: (pinyinRevealed || showResult) ? 'none' : 'blur(6px)',
                  cursor: (pinyinRevealed || showResult) ? 'default' : 'pointer',
                  transition: 'filter 0.2s',
                  userSelect: 'none',
                }}
                title={(!pinyinRevealed && !showResult) ? 'Klik untuk melihat pinyin' : undefined}
              >
                {question.word.pinyin}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {question.options?.map((option, i) => {
                const isCorrect = option === question.word.translation;
                const isSelected = option === selectedAnswer;
                let bg = colors.optionBg;
                let border = colors.optionBorder;
                let color = colors.optionText;
                if (showResult) {
                  if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; color = colors.correctText; }
                  else if (isSelected) { bg = colors.wrongBg; border = colors.wrongBorder; color = colors.wrongText; }
                  else { bg = colors.fadedBg; border = colors.fadedBorder; color = colors.fadedText; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleMCQSelect(option)}
                    disabled={showResult}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: `2px solid ${border}`,
                      background: bg,
                      color,
                      fontSize: '16px',
                      fontWeight: 500,
                      cursor: showResult ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                    {showResult && isCorrect && ' ✓'}
                    {showResult && isSelected && !isCorrect && ' ✗'}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Flashcard */
          <div>
            <div
              onClick={() => setFlipped(!flipped)}
              style={{
                cursor: 'pointer',
                padding: '32px',
                borderRadius: '16px',
                background: flipped ? colors.flashcardBack : colors.flashcardFront,
                color: flipped ? 'white' : colors.cardText,
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                marginBottom: '16px',
              }}
            >
              {!flipped ? (
                <>
                  <div style={{ fontSize: '36px', fontWeight: 700 }}>{question.word.original}</div>
                  {question.word.pinyin && (
                    <div
                      onClick={(e) => { e.stopPropagation(); setPinyinRevealed(true); }}
                      style={{
                        fontSize: '16px',
                        color: colors.pinyinText,
                        marginTop: '8px',
                        filter: (pinyinRevealed || flipped) ? 'none' : 'blur(6px)',
                        cursor: (pinyinRevealed || flipped) ? 'default' : 'pointer',
                        transition: 'filter 0.2s',
                        userSelect: 'none',
                      }}
                      title={(!pinyinRevealed && !flipped) ? 'Klik untuk melihat pinyin' : undefined}
                    >
                      {question.word.pinyin}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: colors.flashcardHint, marginTop: '12px' }}>
                    Klik untuk melihat jawaban
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>🇮🇩 Artinya:</div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{question.word.translation}</div>
                </>
              )}
            </div>
            {flipped && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[
                  { q: 1, label: 'Lupa 😵', bg: '#ef4444' },
                  { q: 3, label: 'Sulit 😅', bg: '#f59e0b' },
                  { q: 5, label: 'Mudah 😎', bg: '#22c55e' },
                ].map(btn => (
                  <button
                    key={btn.q}
                    onClick={() => handleFlashcardRate(btn.q)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: btn.bg,
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skip button */}
        {skipCooldown > 0 && (
          <div style={{ marginTop: '24px' }}>
            {skipTimer > 0 ? (
              <div style={{ fontSize: '13px', color: colors.skipText }}>
                Lewati dalam {skipTimer} detik...
              </div>
            ) : (
              <button
                onClick={onUnlock}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.skipBorder}`,
                  background: colors.skipBg,
                  color: colors.skipText,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Lewati untuk kali ini →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
