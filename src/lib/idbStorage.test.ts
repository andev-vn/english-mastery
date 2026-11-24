import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, resetDbForTests } from './db';
import { idbStorage, resetIdbStorageForTests, storageBackend } from './idbStorage';

beforeEach(async () => {
  await resetDbForTests();
  resetIdbStorageForTests();
});

describe('idbStorage', () => {
  it('stores values in IndexedDB, not localStorage', async () => {
    await idbStorage.setItem('k', '{"a":1}');
    expect(localStorage.getItem('k')).toBeNull();
    expect(await getDb()!.kv.get('k')).toEqual({ key: 'k', value: '{"a":1}' });
    expect(await idbStorage.getItem('k')).toBe('{"a":1}');
    expect(storageBackend()).toBe('indexeddb');
  });

  it('migrates an existing localStorage value into IndexedDB and removes it', async () => {
    localStorage.setItem('em-progress', '{"v":"legacy"}');
    expect(await idbStorage.getItem('em-progress')).toBe('{"v":"legacy"}');
    expect(localStorage.getItem('em-progress')).toBeNull();
    expect((await getDb()!.kv.get('em-progress'))?.value).toBe('{"v":"legacy"}');
    // Later reads come from IndexedDB.
    expect(await idbStorage.getItem('em-progress')).toBe('{"v":"legacy"}');
  });

  it('prefers a localStorage value written after the IndexedDB copy (fallback writes)', async () => {
    await idbStorage.setItem('k', 'old');
    localStorage.setItem('k', 'newer');
    expect(await idbStorage.getItem('k')).toBe('newer');
    expect((await getDb()!.kv.get('k'))?.value).toBe('newer');
  });

  it('removes from both stores', async () => {
    await idbStorage.setItem('k', 'x');
    localStorage.setItem('k', 'y');
    await idbStorage.removeItem('k');
    expect(localStorage.getItem('k')).toBeNull();
    expect(await getDb()!.kv.get('k')).toBeUndefined();
  });
});
