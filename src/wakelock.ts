let lock: WakeLockSentinel | null = null;
let wanted = false;
let listening = false;

async function acquire(): Promise<boolean> {
  try {
    if (!('wakeLock' in navigator)) return false;
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => {
      lock = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function keepScreenOn(): Promise<boolean> {
  wanted = true;
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => {
      if (wanted && document.visibilityState === 'visible' && !lock) void acquire();
    });
  }
  return acquire();
}

export async function allowScreenOff(): Promise<void> {
  wanted = false;
  try {
    await lock?.release();
  } catch {
    /* ignoreras */
  }
  lock = null;
}

export function screenLockActive(): boolean {
  return lock !== null;
}
