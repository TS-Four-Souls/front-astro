import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { useEffect } from "react";
import { useHotkeysContext } from "react-hotkeys-hook";

interface PopupProps {
  children: React.ReactNode;
  onPressBackdrop?: () => void;
  className?: string;
}

export const Popup = ({ children, onPressBackdrop, className }: PopupProps) => {
  const context = useHotkeysContext();

  useEffect(() => {
    const enablePopupScope = () => {
      context.disableScope(HotkeyScope.Main);
      context.enableScope(HotkeyScope.Popup);
    };

    const resetScopes = () => {
      context.enableScope(HotkeyScope.Main);
      context.disableScope(HotkeyScope.Popup);
    };

    enablePopupScope();
    return resetScopes;
  }, []);

  return (
    <div
      className="fixed top-0 left-0 flex h-full w-full place-content-center place-items-center bg-black/50"
      onClick={onPressBackdrop}>
      <div
        className={cn(
          "flex max-h-[90vh] max-w-[90vw] min-w-120 flex-col gap-4 rounded-lg bg-stone-700 p-4",
          className,
        )}
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
