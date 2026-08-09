import React from 'react';

export interface DiffSegment {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

export interface DiffViewerProps {
  diffSegments?: DiffSegment[];
  originalText?: string;
  amendedText?: string;
  className?: string;
}

/**
 * Renders inline word-level diff segments.
 * - Removed text: Red background with strikethrough
 * - Added text: Green background with underline
 * - Unchanged text: Standard font styling
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffSegments,
  originalText = '',
  amendedText = '',
  className = '',
}) => {
  // If diffSegments is empty or missing, generate basic fallback segments
  const segments = React.useMemo(() => {
    if (diffSegments && diffSegments.length > 0) {
      return diffSegments;
    }
    if (originalText.trim() === amendedText.trim()) {
      return [{ type: 'unchanged', text: originalText }] as DiffSegment[];
    }
    const result: DiffSegment[] = [];
    if (originalText.trim()) {
      result.push({ type: 'removed', text: originalText });
    }
    if (amendedText.trim()) {
      result.push({ type: 'added', text: amendedText });
    }
    return result;
  }, [diffSegments, originalText, amendedText]);

  return (
    <div className={`p-4 rounded-2xl bg-[#F4F5F7] border border-[#0A192F]/10 font-mono text-xs sm:text-sm leading-relaxed ${className}`}>
      <div className="text-[10px] font-mono text-[#212529]/60 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
        <span>Word-Level Redline Diff</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-y-1">
        {segments.map((seg, idx) => {
          if (seg.type === 'removed') {
            return (
              <span
                key={idx}
                className="bg-red-500/15 text-red-700 line-through font-mono px-1 py-0.5 rounded mx-0.5 border border-red-500/20 selection:bg-red-200"
                title="Removed from original clause"
              >
                {seg.text}
              </span>
            );
          }
          if (seg.type === 'added') {
            return (
              <span
                key={idx}
                className="bg-emerald-500/15 text-emerald-800 font-semibold underline underline-offset-2 decoration-emerald-600 px-1 py-0.5 rounded mx-0.5 border border-emerald-500/20 selection:bg-emerald-200"
                title="Added in safer reworded proposal"
              >
                {seg.text}
              </span>
            );
          }
          return (
            <span key={idx} className="text-[#0A192F] whitespace-pre-wrap font-mono mx-0.5">
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
