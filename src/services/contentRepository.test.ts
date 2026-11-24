import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDbForTests } from '@/lib/db';
import { lessons } from '@/data/lessons';
import type { ContentDataset } from './content/dataset';
import { fetchRemoteDataset } from './content/remoteDataset';
import { getSupabase, type AppSupabaseClient } from './supabase/client';
import { contentInfo, contentRepository, contentSource, refreshFromRemote, resetContentRepositoryForTests } from './contentRepository';

vi.mock('./supabase/client', () => ({ getSupabase: vi.fn() }));
vi.mock('./content/remoteDataset', () => ({ fetchRemoteDataset: vi.fn() }));

const fakeClient = {} as AppSupabaseClient;

describe('contentRepository', () => {
  beforeEach(async () => {
    await resetDbForTests();
    resetContentRepositoryForTests();
    vi.mocked(getSupabase).mockReset();
    vi.mocked(fetchRemoteDataset).mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it('serves bundled content immediately', async () => {
    expect(await contentRepository.getLessons()).toEqual(lessons);
    expect(contentSource()).toBe('bundled');
    expect((await contentRepository.getLesson('l-a1-greetings'))?.titleVi).toBe('Chào hỏi');
    expect((await contentRepository.getLessons({ moduleId: 'a1-hello' })).map((l) => l.order)).toEqual([1, 2, 3]);
  });

  it('keeps bundled content when Supabase is not configured', async () => {
    vi.mocked(getSupabase).mockResolvedValue(null);
    expect(await refreshFromRemote()).toBe(false);
    expect(fetchRemoteDataset).not.toHaveBeenCalled();
    expect(contentSource()).toBe('bundled');
  });

  it('keeps bundled content when the remote request fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    vi.mocked(fetchRemoteDataset).mockRejectedValue(new Error('project paused'));
    expect(await refreshFromRemote()).toBe(false);
    expect(await contentRepository.getLessons()).toEqual(lessons);
  });

  it('ignores an empty remote dataset', async () => {
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    vi.mocked(fetchRemoteDataset).mockResolvedValue({ levels: [], modules: [], lessons: [], vocabulary: [], vocabularyTopics: [], exercises: [], grammarTopics: [], assessments: [], activities: [] });
    expect(await refreshFromRemote()).toBe(false);
    expect(contentSource()).toBe('bundled');
  });

  const remote: ContentDataset = {
    levels: [{ id: 'A1', name: 'Beginner', nameVi: 'Mới', description: '', order: 1 }],
    modules: [],
    lessons: [{ ...lessons[0]!, titleVi: 'Chào hỏi (cập nhật)' }],
    vocabulary: [],
    vocabularyTopics: [],
    exercises: [],
    grammarTopics: [],
    assessments: [],
    activities: [],
  };

  it('switches to remote content when it loads, and only fetches once per session', async () => {
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    vi.mocked(fetchRemoteDataset).mockResolvedValue(remote);
    expect(await refreshFromRemote()).toBe(true);
    expect(await refreshFromRemote()).toBe(true);
    expect(fetchRemoteDataset).toHaveBeenCalledTimes(1);
    expect(contentSource()).toBe('remote');
    expect((await contentRepository.getLesson('l-a1-greetings'))?.titleVi).toBe('Chào hỏi (cập nhật)');
  });

  it('does not touch the network while offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    expect(await refreshFromRemote()).toBe(false);
    expect(fetchRemoteDataset).not.toHaveBeenCalled();
  });

  it('saves downloaded content and serves it in the next session, even offline', async () => {
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    vi.mocked(fetchRemoteDataset).mockResolvedValue(remote);
    expect(await refreshFromRemote()).toBe(true);
    const savedAt = (await contentInfo()).savedAt;
    expect(savedAt).toBeTruthy();

    // Next app start, offline.
    resetContentRepositoryForTests();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect((await contentRepository.getLesson('l-a1-greetings'))?.titleVi).toBe('Chào hỏi (cập nhật)');
    expect(await contentInfo()).toMatchObject({ source: 'cache', savedAt, counts: { lessons: 1 } });
    expect(await refreshFromRemote()).toBe(false);
    expect(contentSource()).toBe('cache');
  });

  it('downloads again when forced', async () => {
    vi.mocked(getSupabase).mockResolvedValue(fakeClient);
    vi.mocked(fetchRemoteDataset).mockResolvedValue(remote);
    await refreshFromRemote();
    expect(await refreshFromRemote(10_000, { force: true })).toBe(true);
    expect(fetchRemoteDataset).toHaveBeenCalledTimes(2);
  });
});
