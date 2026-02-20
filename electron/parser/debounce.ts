/**
 * Debounce & Confidence Gate
 * Prevents rapid-fire emissions of the same reference
 */

let lastRef = "";
let lastTime = 0;
const DEBOUNCE_MS = 5000; // 5 seconds between same reference

/**
 * Check if a reference should be emitted
 * Returns false if it's a duplicate within the debounce window
 */
export function shouldEmit(ref: string): boolean {
  const now = Date.now();

  // Same reference within debounce window = skip
  if (ref === lastRef && now - lastTime < DEBOUNCE_MS) {
    return false;
  }

  lastRef = ref;
  lastTime = now;
  return true;
}

/**
 * Reset the debounce state
 */
export function resetDebounce(): void {
  lastRef = "";
  lastTime = 0;
}

/**
 * Get time until next emission is allowed for the same reference
 */
export function getTimeUntilReady(): number {
  const elapsed = Date.now() - lastTime;
  return Math.max(0, DEBOUNCE_MS - elapsed);
}
