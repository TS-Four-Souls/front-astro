import { useGameContext } from "./contexts/game-context";
import { useHistoryContext } from "./contexts/history-context";
import { useRef, useEffect } from "react";
import { StackElementIcon } from "./stack-element-icon";
import { Button } from "../button";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";

export const History = () => {
  const { state, parameters } = useGameContext();
  const { isOpen } = useHistoryContext();
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToastContext();

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

  const rollback = () => {
    socket.emit("rollback", (response) => {
      if (response.status === 400)
        toast("error", "Failed to rollback", response.error);
    });
  };

  return (
    <div className="flex h-86 w-14 flex-col gap-2 rounded-lg bg-taupe-800 p-2 inset-shadow-sm inset-shadow-taupe-950/30">
      <div
        ref={scrollViewRef}
        className="no-scrollbar relative flex grow flex-col items-center gap-1.5 overflow-y-auto transition-colors duration-300">
        {displayedHistory.map((element, index) => (
          <StackElementIcon key={index} element={element} />
        ))}
      </div>
      <Button
        hotkey="backspace"
        onClick={rollback}
        tooltip={{
          title: "Rollback",
          content: parameters.allowCheatOptions.value
            ? "Rollback the last action."
            : "Rollback the last action.\nYou can only rollback other players' actions.",
          enabled: true,
        }}
        theme="onDark"
        className="h-10 shrink-0 p-0"
      />
    </div>
  );
};
