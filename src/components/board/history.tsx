import { useGameContext } from "./contexts/game-context";
import { useHistoryContext } from "./contexts/history-context";
import { useRef, useEffect } from "react";
import { StackElementIcon } from "./stack-element-icon";

export const History = () => {
  const { state } = useGameContext();
  const { isOpen } = useHistoryContext();
  const scrollViewRef = useRef<HTMLDivElement>(null);

  // Show history in reverse order (newest first)
  const reversedHistory = state.history.toReversed();
  const displayedHistory = reversedHistory.slice(0, 30);

  if (!isOpen) return null;

  useEffect(() => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    // Measure if the scroll view is overflowing
    const isOverflowing = scrollView.scrollHeight > scrollView.clientHeight;
    if (isOverflowing) {
      scrollView.classList.add("scroll-priority");
    } else {
      scrollView.classList.remove("scroll-priority");
    }
  }, [state.stack.length]);

  return (
    <div className="rounded-lg bg-stone-900 transform-3d">
      <div
        ref={scrollViewRef}
        className="no-scrollbar relative flex h-86 w-14 translate-z-1 flex-col items-center gap-1.5 overflow-y-auto p-2 transition-colors duration-300">
        {displayedHistory.map((element, index) => (
          <StackElementIcon key={index} element={element} />
        ))}
      </div>
    </div>
  );
};
