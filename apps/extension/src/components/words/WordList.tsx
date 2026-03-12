import { useState } from 'react';
import type { Word, TargetLanguage } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { useWordStore } from '../../stores/wordStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { enrichWord } from '../../lib/openrouter';
import { WordCard } from './WordCard';
import { cn } from '../../lib/cn';

type Filter = 'all' | TargetLanguage;

export function WordList() {
  const { words, deleteWord, updateWord, searchWords } = useWordStore();
  const { settings } = useSettingsStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = search
    ? searchWords(search)
    : filter === 'all'
      ? words
      : words.filter(w => w.targetLanguage === filter);

  const handleRefresh = async (word: Word) => {
    if (!settings.openRouterApiKey) return;
    const result = await enrichWord(
      settings.openRouterApiKey,
      word.original,
      word.translation,
      word.targetLanguage,
    );
    await updateWord(word.id, {
      sentences: result.sentences.length > 0 ? result.sentences : word.sentences,
      distractors: result.distractors.length > 0 ? result.distractors : word.distractors,
      acceptedAnswers: result.acceptedAnswers.length > 0 ? result.acceptedAnswers : word.acceptedAnswers,
      lastEnrichedAt: Date.now(),
    });
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      setDeleting(id);
      setDeleteConfirm(null);
      await deleteWord(id);
      setDeleting(null);
    } else {
      setDeleteConfirm(id);
      // Auto-cancel after 3s
      setTimeout(() => setDeleteConfirm(prev => prev === id ? null : prev), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Cari kata..."
        className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      {/* Language filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          )}
        >
          Semua ({words.length})
        </button>
        {settings.learningLanguages.map(lang => {
          const count = words.filter(w => w.targetLanguage === lang).length;
          return (
            <button
              key={lang}
              onClick={() => setFilter(lang)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === lang
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              )}
            >
              {LANGUAGES[lang].flag} {count}
            </button>
          );
        })}
      </div>

      {/* Word list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-400">
            {search ? 'Tidak ada kata yang cocok' : 'Belum ada kata'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(word => (
            <WordCard
              key={word.id}
              word={word}
              onDelete={handleDelete}
              onRefresh={settings.openRouterApiKey ? handleRefresh : undefined}
              isConfirming={deleteConfirm === word.id}
              isDeleting={deleting === word.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
