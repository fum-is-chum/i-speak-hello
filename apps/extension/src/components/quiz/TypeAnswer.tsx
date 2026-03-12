import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from './SpeakButton';
import { HintReveal } from './HintReveal';
import { QuizInput } from './QuizInput';
import { ResultFeedback } from './ResultFeedback';
import { isAnswerClose } from '../../lib/quiz-engine';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';

interface TypeAnswerProps {
  question: QuizQuestion;
  onAnswer: (quality: number) => void;
  autoSpeak?: boolean;
}

export function TypeAnswer({ question, onAnswer, autoSpeak }: TypeAnswerProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { word, hint, sentencePinyin } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useAutoSpeak(word.original, word.targetLanguage, autoSpeak);

  const handleSubmit = () => {
    const correct = isAnswerClose(input, word.translation, word.acceptedAnswers);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(correct ? 4 : 1);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question */}
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <span className="text-sm text-gray-400">{langInfo.flag} Tulis artinya dalam Bahasa Indonesia</span>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{word.original}</p>
        {word.pinyin && (
          <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" hidden forceReveal={submitted} />
        )}
        <SpeakButton text={word.original} language={word.targetLanguage} className="mt-3" />

        {/* Sentence pinyin + Indonesian hint — blurred by default */}
        {(sentencePinyin || hint) && (
          <HintReveal forceReveal={submitted} className="mt-3">
            {sentencePinyin && word.targetLanguage === 'zh' && (
              <PinyinDisplay pinyin={sentencePinyin} className="text-sm mb-1" />
            )}
            {hint && (
              <p className="text-sm text-gray-400">
                💡 Petunjuk: {hint}
              </p>
            )}
          </HintReveal>
        )}
      </div>

      {/* Input */}
      <QuizInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        submitted={submitted}
        isCorrect={isCorrect}
        placeholder="Ketik jawaban di sini..."
      />

      {submitted && (
        <ResultFeedback
          isCorrect={isCorrect}
          correctAnswer={word.translation}
          acceptedAnswers={word.acceptedAnswers}
        />
      )}
    </div>
  );
}
