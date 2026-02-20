/**
 * Scripture Display Component
 *
 * Features:
 * - Dual state: pendingRef (AI suggestions) and currentRef (displayed)
 * - Promotion rules to prevent flicker
 * - Visual hierarchy: book → chapter → verse
 * - Smooth transitions
 */
import { useState, useEffect, useCallback } from "react";

export interface DisplayRef {
  book: string | null;
  chapter: number | null;
  verse: number | null;
  confidence: number;
  timestamp: number;
}

interface ScriptureDisplayProps {
  className?: string;
}

/**
 * Determine if pending ref should be promoted to current
 */
function shouldPromote(
  pending: DisplayRef,
  current: DisplayRef | null
): boolean {
  if (!current) return true;

  // Same reference → ignore
  if (
    pending.book === current.book &&
    pending.chapter === current.chapter &&
    pending.verse === current.verse
  ) {
    return false;
  }

  // Only promote if confidence is strong
  if (pending.confidence < 0.85) return false;

  // Promote immediately if verse appears
  if (pending.verse !== null) return true;

  // Promote book or chapter only if stable (400ms)
  return Date.now() - pending.timestamp > 400;
}

/**
 * Get display level based on completeness
 */
function getDisplayLevel(
  ref: DisplayRef | null
): "none" | "book" | "chapter" | "final" {
  if (!ref || !ref.book) return "none";
  if (ref.verse !== null) return "final";
  if (ref.chapter !== null) return "chapter";
  return "book";
}

/**
 * Format reference for display
 */
function formatReference(ref: DisplayRef | null): string {
  if (!ref || !ref.book) return "";

  let text = ref.book.toUpperCase();

  if (ref.chapter !== null) {
    text += ` ${ref.chapter}`;
  }

  if (ref.verse !== null) {
    text += `:${ref.verse}`;
  }

  return text;
}

/**
 * Hook for managing scripture display state
 */
export function useScriptureDisplay() {
  const [currentRef, setCurrentRef] = useState<DisplayRef | null>(null);
  const [pendingRef, setPendingRef] = useState<DisplayRef | null>(null);

  // Handle incoming verse detection
  const handleVerseDetected = useCallback(
    (data: {
      book: string;
      chapter: number;
      verse?: number | null;
      confidence?: number;
    }) => {
      setPendingRef({
        book: data.book,
        chapter: data.chapter,
        verse: data.verse ?? null,
        confidence: data.confidence ?? 0.9,
        timestamp: Date.now(),
      });
    },
    []
  );

  // Promotion effect
  useEffect(() => {
    if (!pendingRef) return;

    // Check immediately
    if (shouldPromote(pendingRef, currentRef)) {
      setCurrentRef(pendingRef);
    } else {
      // Check again after stability delay
      const timer = setTimeout(() => {
        if (shouldPromote(pendingRef, currentRef)) {
          setCurrentRef(pendingRef);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pendingRef, currentRef]);

  // Set up IPC listener
  useEffect(() => {
    if (!window.api?.onVerseDetected) return;

    const cleanup = window.api.onVerseDetected((data) => {
      handleVerseDetected(data);
    });

    return cleanup;
  }, [handleVerseDetected]);

  return {
    currentRef,
    pendingRef,
    displayLevel: getDisplayLevel(currentRef),
    displayText: formatReference(currentRef),
    setCurrentRef,
    setPendingRef,
    handleVerseDetected,
  };
}

/**
 * Scripture Display Component
 */
export function ScriptureDisplay({ className = "" }: ScriptureDisplayProps) {
  const {
    currentRef: _currentRef,
    displayLevel,
    displayText,
  } = useScriptureDisplay();

  if (displayLevel === "none") {
    return (
      <div className={`scripture-display empty ${className}`}>
        <span className="waiting-text">Waiting for scripture...</span>
      </div>
    );
  }

  return (
    <div className={`scripture-display ${displayLevel} ${className}`}>
      <span className="scripture-text">{displayText}</span>
    </div>
  );
}

/**
 * CSS Styles (to be added to your stylesheet)
 *
 * .scripture-display {
 *   transition: all 0.15s ease-out;
 * }
 *
 * .scripture-display.book {
 *   font-size: 48px;
 *   opacity: 0.6;
 * }
 *
 * .scripture-display.chapter {
 *   font-size: 56px;
 *   opacity: 0.8;
 * }
 *
 * .scripture-display.final {
 *   font-size: 64px;
 *   font-weight: 700;
 *   opacity: 1;
 * }
 */

export default ScriptureDisplay;
