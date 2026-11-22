import { describe, expect, it } from 'vitest';
import { decideProfileSync } from './profileSync';

const T1 = '2026-11-20T10:00:00.000Z';
const T2 = '2026-11-21T10:00:00.000Z';

describe('decideProfileSync', () => {
  it('links an onboarded guest profile to a new account', () => {
    expect(decideProfileSync({ onboarded: true, updatedAt: T1 }, { onboarded: false, updatedAt: T2 })).toBe('push');
  });

  it('restores an existing account on a fresh device', () => {
    expect(decideProfileSync({ onboarded: false }, { onboarded: true, updatedAt: T1 })).toBe('pull');
  });

  it('keeps the most recently updated side when both are onboarded', () => {
    expect(decideProfileSync({ onboarded: true, updatedAt: T2 }, { onboarded: true, updatedAt: T1 })).toBe('push');
    expect(decideProfileSync({ onboarded: true, updatedAt: T1 }, { onboarded: true, updatedAt: T2 })).toBe('pull');
    expect(decideProfileSync({ onboarded: true, updatedAt: T1 }, { onboarded: true, updatedAt: T1 })).toBe('none');
  });

  it('treats a local profile without timestamp as older', () => {
    expect(decideProfileSync({ onboarded: true }, { onboarded: true, updatedAt: T1 })).toBe('pull');
  });

  it('does nothing when neither side is onboarded', () => {
    expect(decideProfileSync({ onboarded: false }, { onboarded: false, updatedAt: T1 })).toBe('none');
    expect(decideProfileSync({ onboarded: false }, null)).toBe('none');
  });
});
