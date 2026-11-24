/**
 * Browser storage quota and persistence (StorageManager). Without persistence the browser may evict
 * site data when the device runs low on space; installed PWAs are usually granted it automatically.
 */
export interface StorageInfo {
  usageBytes?: number;
  quotaBytes?: number;
  /** undefined = the browser cannot tell. */
  persisted?: boolean;
  canPersist: boolean;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage) return { canPersist: false };
  const [estimate, persisted] = await Promise.all([
    storage.estimate?.().catch(() => undefined),
    storage.persisted?.().catch(() => undefined),
  ]);
  return {
    usageBytes: estimate?.usage,
    quotaBytes: estimate?.quota,
    persisted,
    canPersist: typeof storage.persist === 'function',
  };
}

/** Asks the browser to keep this site's data. Resolves whether it is now persisted. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
