import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserSettings, Word, QuizQuestion } from '@i-speak-hello/shared';
import { buildQuizSession, isAnswerClose } from '../../src/lib/quiz-engine';
import { recordQuizAnswer } from '../../src/lib/quiz-helpers';

interface Props {
  settings: UserSettings;
  words: Word[];
  hostname: string;
  onUnlock: () => void;
}

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

  // Build quiz using all 4 types
  const [questions] = useState<QuizQuestion[]>(() =>
    buildQuizSession(words, settings.quizTypes, questionsNeeded, 0, settings.difficultyBias)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [skipTimer, setSkipTimer] = useState(skipCooldown);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [pinyinRevealed, setPinyinRevealed] = useState(false);
  const [typingInput, setTypingInput] = useState('');
  const [typingResult, setTypingResult] = useState<boolean | null>(null);

  const c = useMemo(() => isDark ? {
    overlay: 'rgba(0,0,0,0.9)',
    cardBg: '#1c1917', cardText: '#fafaf9', subText: '#a8a29e',
    accent: '#14b8a6', accentBg: 'rgba(13,148,136,0.2)', accentText: '#5eead4',
    dotInactive: '#44403c', dotActive: '#16a34a', dotCurrent: '#0f766e',
    optBg: '#292524', optBorder: '#44403c', optText: '#d6d3d1',
    correctBg: 'rgba(22,163,74,0.15)', correctBorder: '#16a34a', correctText: '#86efac',
    wrongBg: 'rgba(220,38,38,0.15)', wrongBorder: '#dc2626', wrongText: '#fca5a5',
    fadedBg: '#292524', fadedBorder: '#44403c', fadedText: '#78716c',
    flashFront: '#292524',
    flashBack: 'linear-gradient(135deg, #0f766e, #0d9488, #06b6d4)',
    hint: '#78716c', skipText: '#78716c', skipBorder: '#44403c',
    inputBg: '#292524', inputBorder: '#44403c',
    headerBg: 'linear-gradient(135deg, #0f766e, #06b6d4)',
  } : {
    overlay: 'rgba(0,0,0,0.85)',
    cardBg: '#ffffff', cardText: '#1c1917', subText: '#a8a29e',
    accent: '#0f766e', accentBg: '#f0fdfa', accentText: '#0f766e',
    dotInactive: '#e7e5e4', dotActive: '#16a34a', dotCurrent: '#0f766e',
    optBg: '#fafaf9', optBorder: '#e7e5e4', optText: '#44403c',
    correctBg: '#f0fdf4', correctBorder: '#16a34a', correctText: '#15803d',
    wrongBg: '#fef2f2', wrongBorder: '#dc2626', wrongText: '#b91c1c',
    fadedBg: '#fafaf9', fadedBorder: '#e7e5e4', fadedText: '#a8a29e',
    flashFront: '#f5f5f4',
    flashBack: 'linear-gradient(135deg, #0f766e, #0d9488, #06b6d4)',
    hint: '#a8a29e', skipText: '#a8a29e', skipBorder: '#e7e5e4',
    inputBg: '#ffffff', inputBorder: '#e7e5e4',
    headerBg: 'linear-gradient(135deg, #0f766e, #06b6d4)',
  }, [isDark]);

  useEffect(() => {
    if (skipCooldown <= 0 || skipTimer <= 0) return;
    const interval = setInterval(() => {
      setSkipTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [skipCooldown, skipTimer]);

  const advanceToNext = useCallback((nextAnswered: number) => {
    if (nextAnswered >= questionsNeeded || currentIdx + 1 >= questions.length) {
      onUnlock();
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setFlipped(false);
      setPinyinRevealed(false);
      setTypingInput('');
      setTypingResult(null);
    }
  }, [currentIdx, questions.length, questionsNeeded, onUnlock]);

  const handleMCQSelect = useCallback((option: string) => {
    if (showResult) return;
    const q = questions[currentIdx];
    setSelectedAnswer(option);
    setShowResult(true);
    recordQuizAnswer(q.word, option === q.word.translation ? 4 : 1, 'mcq');
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      advanceToNext(next);
    }, 1200);
  }, [showResult, questions, currentIdx, answered, advanceToNext]);

  const handleFlashcardRate = useCallback((quality: number) => {
    const q = questions[currentIdx];
    recordQuizAnswer(q.word, quality, 'flashcard');
    const next = answered + 1;
    setAnswered(next);
    advanceToNext(next);
  }, [questions, currentIdx, answered, advanceToNext]);

  const handleTypingSubmit = useCallback(() => {
    if (typingResult !== null) return;
    const q = questions[currentIdx];
    const isTyping = q.quizType === 'typing';
    const answer = isTyping ? q.word.translation : (q.sentenceAnswer ?? q.word.original);
    const accepted = isTyping ? q.word.acceptedAnswers : undefined;
    const correct = isAnswerClose(typingInput, answer, accepted);
    setTypingResult(correct);
    setShowResult(true);
    recordQuizAnswer(q.word, correct ? (isTyping ? 4 : 5) : 1, q.quizType);
    setTimeout(() => {
      const next = answered + 1;
      setAnswered(next);
      advanceToNext(next);
    }, 2000);
  }, [typingResult, questions, currentIdx, typingInput, answered, advanceToNext]);

  const question = questions[currentIdx];
  if (!question) { onUnlock(); return null; }

  const isTypingQuiz = question.quizType === 'typing';
  const isSentenceQuiz = question.quizType === 'sentence';

  return (
    <div onKeyDown={e => e.stopPropagation()} onKeyUp={e => e.stopPropagation()} onKeyPress={e => e.stopPropagation()} style={{ position:'fixed', inset:0, zIndex:2147483647, display:'flex', alignItems:'center', justifyContent:'center', background:c.overlay, backdropFilter:'blur(12px)', fontFamily:'Inter,-apple-system,BlinkMacSystemFont,sans-serif' }}>
      <div style={{ background:c.cardBg, borderRadius:'24px', maxWidth:'480px', width:'90%', overflow:'hidden', boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.5)' : '0 25px 60px rgba(0,0,0,0.3)' }}>

        {/* Gradient Header */}
        <div style={{ background:c.headerBg, padding:'16px 24px', color:'white' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'18px' }}>🌏</span>
              <span style={{ fontWeight:700 }}>I Speak Hello</span>
            </div>
            <span style={{ fontSize:'11px', background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:'999px', fontWeight:500 }}>Site Quiz</span>
          </div>
          <p style={{ fontSize:'13px', opacity:0.85 }}>Jawab <b>{questionsNeeded} pertanyaan</b> untuk membuka <b>{hostname}</b></p>
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:'10px', padding:'16px 0', borderBottom:`1px solid ${c.optBorder}` }}>
          {Array.from({ length: questionsNeeded }).map((_, i) => (
            <div key={i} style={{
              width: i === answered ? '14px' : '12px', height: i === answered ? '14px' : '12px',
              borderRadius: '50%',
              background: i < answered ? c.dotActive : i === answered ? c.dotCurrent : c.dotInactive,
              transition: 'all 0.3s',
              boxShadow: i === answered ? `0 0 0 4px ${isDark ? 'rgba(13,148,136,0.2)' : 'rgba(13,148,136,0.15)'}` : 'none',
            }} />
          ))}
        </div>

        <div style={{ padding:'24px' }}>

          {/* MCQ */}
          {question.quizType === 'mcq' && (
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, textAlign:'center', color:c.accentText, marginBottom:'4px' }}>📝 Pilihan Ganda</div>
              <div style={{ fontSize:'12px', textAlign:'center', color:c.subText, marginBottom:'16px' }}>Apa arti kata ini?</div>
              <div style={{ textAlign:'center', marginBottom:'4px' }}>
                <span style={{ fontSize:'12px', color:c.subText }}>{question.word.targetLanguage === 'zh' ? '🇨🇳' : '🇬🇧'}</span>
                <div style={{ fontSize:'36px', fontWeight:700, color:c.cardText, marginTop:'4px' }}>{question.word.original}</div>
                {question.word.pinyin && (
                  <div onClick={() => setPinyinRevealed(true)} style={{ fontSize:'14px', color:c.accentText, marginTop:'4px', filter: (pinyinRevealed || showResult) ? 'none' : 'blur(6px)', cursor: (pinyinRevealed || showResult) ? 'default' : 'pointer', transition:'filter 0.2s', userSelect:'none' }}>{question.word.pinyin}</div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'16px' }}>
                {question.options?.map((option, i) => {
                  const isCorrect = option === question.word.translation;
                  const isSelected = option === selectedAnswer;
                  let bg = c.optBg, border = c.optBorder, color = c.optText;
                  if (showResult) {
                    if (isCorrect) { bg = c.correctBg; border = c.correctBorder; color = c.correctText; }
                    else if (isSelected) { bg = c.wrongBg; border = c.wrongBorder; color = c.wrongText; }
                    else { bg = c.fadedBg; border = c.fadedBorder; color = c.fadedText; }
                  }
                  return (
                    <button key={i} onClick={() => handleMCQSelect(option)} disabled={showResult} style={{ padding:'12px 16px', borderRadius:'12px', border:`2px solid ${border}`, background:bg, color, fontSize:'15px', fontWeight:500, cursor: showResult ? 'default' : 'pointer', textAlign:'left', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ width:'28px', height:'28px', borderRadius:'50%', background: (showResult && isCorrect) ? c.correctBorder : (showResult && isSelected && !isCorrect) ? c.wrongBorder : c.optBorder, color: (showResult && (isCorrect || (isSelected && !isCorrect))) ? 'white' : c.subText, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>{String.fromCharCode(65 + i)}</span>
                      {option}
                      {showResult && isCorrect && ' ✓'}
                      {showResult && isSelected && !isCorrect && ' ✗'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flashcard with 3D flip */}
          {question.quizType === 'flashcard' && (
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, textAlign:'center', color:c.accentText, marginBottom:'16px' }}>🃏 Flashcard</div>
              <div
                onClick={() => setFlipped(!flipped)}
                style={{ perspective:'1000px', cursor:'pointer', marginBottom:'16px' }}
              >
                <div style={{
                  position:'relative', minHeight:'180px',
                  transition:'transform 0.6s', transformStyle:'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}>
                  {/* Front */}
                  <div style={{
                    position:'absolute', inset:0, backfaceVisibility:'hidden',
                    padding:'28px', borderRadius:'16px', background:c.flashFront, color:c.cardText,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  }}>
                    <div style={{ fontSize:'36px', fontWeight:700 }}>{question.word.original}</div>
                    {question.word.pinyin && (
                      <div onClick={(e) => { e.stopPropagation(); setPinyinRevealed(true); }} style={{ fontSize:'14px', color:c.accentText, marginTop:'8px', filter: (pinyinRevealed || flipped) ? 'none' : 'blur(6px)', cursor: (pinyinRevealed || flipped) ? 'default' : 'pointer', transition:'filter 0.2s', userSelect:'none' }}>{question.word.pinyin}</div>
                    )}
                    <div style={{ fontSize:'12px', color:c.hint, marginTop:'12px' }}>Klik untuk melihat jawaban</div>
                  </div>
                  {/* Back */}
                  <div style={{
                    position:'absolute', inset:0, backfaceVisibility:'hidden',
                    transform:'rotateY(180deg)',
                    padding:'28px', borderRadius:'16px', background:c.flashBack, color:'white',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  }}>
                    <div style={{ fontSize:'13px', opacity:0.8, marginBottom:'8px' }}>🇮🇩 Artinya:</div>
                    <div style={{ fontSize:'28px', fontWeight:700 }}>{question.word.translation}</div>
                  </div>
                </div>
              </div>
              {flipped && (
                <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
                  {[
                    { q: 1, label: 'Lupa 😵', bg: '#dc2626' },
                    { q: 3, label: 'Sulit 😅', bg: '#f97316' },
                    { q: 5, label: 'Mudah 😎', bg: '#16a34a' },
                  ].map(btn => (
                    <button key={btn.q} onClick={() => handleFlashcardRate(btn.q)} style={{ padding:'10px 16px', borderRadius:'10px', border:'none', background:btn.bg, color:'white', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>{btn.label}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Typing Quiz */}
          {isTypingQuiz && (
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, textAlign:'center', color:c.accentText, marginBottom:'4px' }}>⌨️ Ketik Jawaban</div>
              <div style={{ fontSize:'12px', textAlign:'center', color:c.subText, marginBottom:'16px' }}>Apa arti kata ini?</div>
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <span style={{ fontSize:'12px', color:c.subText }}>{question.word.targetLanguage === 'zh' ? '🇨🇳' : '🇬🇧'}</span>
                <div style={{ fontSize:'36px', fontWeight:700, color:c.cardText, marginTop:'4px' }}>{question.word.original}</div>
                {question.word.pinyin && (
                  <div onClick={() => setPinyinRevealed(true)} style={{ fontSize:'14px', color:c.accentText, marginTop:'4px', filter: (pinyinRevealed || showResult) ? 'none' : 'blur(6px)', cursor: (pinyinRevealed || showResult) ? 'default' : 'pointer', transition:'filter 0.2s', userSelect:'none' }}>{question.word.pinyin}</div>
                )}
              </div>
              <input
                type="text" value={typingInput} disabled={showResult}
                onChange={e => setTypingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && typingInput.trim()) handleTypingSubmit(); }}
                placeholder="Ketik terjemahan..."
                autoFocus
                style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border: `2px solid ${showResult ? (typingResult ? c.correctBorder : c.wrongBorder) : c.inputBorder}`, background: showResult ? (typingResult ? c.correctBg : c.wrongBg) : c.inputBg, color: showResult ? (typingResult ? c.correctText : c.wrongText) : c.cardText, fontSize:'16px', outline:'none', boxSizing:'border-box', marginBottom:'12px', textDecoration: showResult && !typingResult ? 'line-through' : 'none' }}
              />
              {!showResult && (
                <button onClick={handleTypingSubmit} disabled={!typingInput.trim()} style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background: typingInput.trim() ? c.accent : c.optBorder, color:'white', fontSize:'15px', fontWeight:600, cursor: typingInput.trim() ? 'pointer' : 'not-allowed', opacity: typingInput.trim() ? 1 : 0.5 }}>Periksa</button>
              )}
              {showResult && (
                <div style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${typingResult ? c.correctBorder : c.wrongBorder}`, background: typingResult ? c.correctBg : c.wrongBg, marginTop:'8px' }}>
                  <div style={{ fontWeight:600, color: typingResult ? c.correctText : c.wrongText, marginBottom: typingResult ? '0' : '4px' }}>
                    {typingResult ? '✓ Benar!' : '✗ Kurang tepat'}
                  </div>
                  {!typingResult && <div style={{ fontSize:'14px', color: c.cardText }}>Jawaban: <b>{question.word.translation}</b></div>}
                </div>
              )}
            </div>
          )}

          {/* Sentence Completion Quiz */}
          {isSentenceQuiz && (
            <div>
              <div style={{ fontSize:'12px', fontWeight:600, textAlign:'center', color:c.accentText, marginBottom:'4px' }}>📖 Lengkapi Kalimat</div>
              <div style={{ fontSize:'12px', textAlign:'center', color:c.subText, marginBottom:'16px' }}>Isi kata yang hilang</div>
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <p style={{ fontSize:'22px', fontWeight:700, color:c.cardText, lineHeight:1.6 }}>
                  {question.sentenceTemplate?.split('______').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        showResult ? (
                          <span style={{ display:'inline-block', margin:'0 4px', padding:'2px 12px', borderRadius:'8px', border:`2px solid ${typingResult ? c.correctBorder : c.wrongBorder}`, background: typingResult ? c.correctBg : c.wrongBg, color: typingResult ? c.correctText : c.wrongText, fontWeight:700 }}>
                            {question.sentenceAnswer ?? question.word.original}
                          </span>
                        ) : (
                          <span style={{ display:'inline-block', margin:'0 4px', padding:'2px 12px', borderRadius:'8px', background: c.accentBg, border:'2px dashed', borderColor: c.accent, color: c.accent, minWidth:'60px', fontSize:'14px' }}>______</span>
                        )
                      )}
                    </span>
                  ))}
                </p>
                {question.word.pinyin && (
                  <div onClick={() => setPinyinRevealed(true)} style={{ fontSize:'12px', color:c.accentText, marginTop:'6px', filter: (pinyinRevealed || showResult) ? 'none' : 'blur(6px)', cursor: 'pointer', transition:'filter 0.2s', userSelect:'none' }}>{question.sentencePinyin || question.word.pinyin}</div>
                )}
              </div>
              {question.hint && (
                <div style={{ padding:'8px 12px', borderRadius:'8px', background: c.optBg, marginBottom:'12px', textAlign:'center' }}>
                  <p style={{ fontSize:'12px', color:c.subText, fontStyle:'italic' }}>"{question.hint}"</p>
                </div>
              )}
              <input
                type="text" value={typingInput} disabled={showResult}
                onChange={e => setTypingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && typingInput.trim()) handleTypingSubmit(); }}
                placeholder="Ketik kata yang hilang..."
                autoFocus
                style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border: `2px solid ${showResult ? (typingResult ? c.correctBorder : c.wrongBorder) : c.inputBorder}`, background: showResult ? (typingResult ? c.correctBg : c.wrongBg) : c.inputBg, color: showResult ? (typingResult ? c.correctText : c.wrongText) : c.cardText, fontSize:'16px', outline:'none', boxSizing:'border-box', marginBottom:'12px', textAlign:'center', fontWeight:500 }}
              />
              {!showResult && (
                <button onClick={handleTypingSubmit} disabled={!typingInput.trim()} style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background: typingInput.trim() ? c.accent : c.optBorder, color:'white', fontSize:'15px', fontWeight:600, cursor: typingInput.trim() ? 'pointer' : 'not-allowed', opacity: typingInput.trim() ? 1 : 0.5 }}>Periksa</button>
              )}
              {showResult && (
                <div style={{ padding:'12px 16px', borderRadius:'12px', border:`1px solid ${typingResult ? c.correctBorder : c.wrongBorder}`, background: typingResult ? c.correctBg : c.wrongBg, marginTop:'8px' }}>
                  <div style={{ fontWeight:600, color: typingResult ? c.correctText : c.wrongText }}>
                    {typingResult ? '✓ Sempurna!' : '✗ Kurang tepat'}
                  </div>
                  {!typingResult && <div style={{ fontSize:'14px', color:c.cardText, marginTop:'4px' }}>Jawaban: <b>{question.sentenceAnswer ?? question.word.original}</b></div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Skip footer */}
        {skipCooldown > 0 && (
          <div style={{ borderTop:`1px solid ${c.optBorder}`, padding:'12px 24px', textAlign:'center' }}>
            {skipTimer > 0 ? (
              <span style={{ fontSize:'13px', color:c.skipText }}>Lewati (tunggu <b>{skipTimer}s</b>)</span>
            ) : (
              <button onClick={onUnlock} style={{ padding:'8px 20px', borderRadius:'8px', border:`1px solid ${c.skipBorder}`, background:'transparent', color:c.skipText, fontSize:'13px', cursor:'pointer' }}>Lewati untuk kali ini →</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
