import React, { useEffect, useRef, useState } from 'react';

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  height?: number;
}

const ITEM_HEIGHT = 40;
const SCROLL_SETTLE_MS = 150;

export const ScrollPicker: React.FC<ScrollPickerProps> = ({ min, max, value, onChange, height = 150 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [, setIsScrolling] = useState(false);

  // Centre the initial value; deliberately runs once on mount only, matching
  // the original picker (re-centring on every external `value` change would
  // fight the user's own in-progress scroll gesture).
  useEffect(() => {
    if (scrollRef.current) {
      const index = options.indexOf(value);
      scrollRef.current.scrollTop = index * ITEM_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    setIsScrolling(true);
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);

    settleTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const index = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
      const newValue = options[index];
      if (newValue !== undefined && newValue !== value) {
        onChange(newValue);
      }
      setIsScrolling(false);
    }, SCROLL_SETTLE_MS);
  };

  useEffect(() => () => clearTimeout(settleTimeoutRef.current), []);

  return (
    <div
      className="relative overflow-hidden bg-slate-50 rounded-xl border border-slate-200 select-none"
      style={{ height: `${height}px`, width: '100px' }}
    >
      <div
        className="absolute top-1/2 left-0 right-0 border-y border-blue-200 bg-blue-50/50 pointer-events-none -translate-y-1/2"
        style={{ height: `${ITEM_HEIGHT}px` }}
      />
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10" />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide flex flex-col items-center"
        style={{ paddingBlock: `${(height - ITEM_HEIGHT) / 2}px` }}
      >
        {options.map((opt) => (
          <div
            key={opt}
            className={`snap-center h-[40px] flex items-center justify-center text-lg font-mono transition-all shrink-0 ${
              value === opt ? 'text-blue-600 font-bold scale-110' : 'text-slate-400'
            }`}
            style={{ minHeight: `${ITEM_HEIGHT}px` }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
};
