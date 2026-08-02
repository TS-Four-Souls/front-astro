import { cn } from "@/utils/cn";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { type Tooltip, useTooltip } from "./board/use-tooltip";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  label?: React.ReactNode;
  hotkey?: string;
  hotkeyScope?: HotkeyScope[];
  type?: "button" | "submit" | "reset" | undefined;
  theme?: "default" | "onLight" | "onDark" | "onSpace";
  tooltip?: Tooltip;
}

export const Button = ({
  onClick,
  disabled,
  active,
  label,
  className,
  hotkey,
  hotkeyScope = [HotkeyScope.Main],
  theme = "default",
  type = undefined,
  tooltip,
}: ButtonProps) => {
  useHotkeys(hotkey ?? "enter", () => onClick?.(), {
    scopes: hotkeyScope,
    enabled: onClick !== undefined && hotkey !== undefined,
    useKey: shouldUseKey(hotkey ?? ""),
  });

  const { setTooltip, closeTooltip } = useTooltip(tooltip);

  return (
    <button
      className={cn(
        "relative overflow-hidden shrink-0 flex place-content-center place-items-center gap-2 rounded-md px-4 py-2 font-main text-white uppercase shadow-2xl inset-shadow-xs shadow-taupe-950/10 inset-shadow-taupe-100/10 transition-[colors,filter]",
        theme === "default" && "bg-taupe-600",
        theme === "onLight" && "bg-taupe-500",
        theme === "onDark" && "bg-taupe-700",
        theme === "onSpace" && "bg-space-500 shadow-black/30",
        active ? "bg-taupe-300 text-taupe-900" : "",
        onClick &&
          (disabled
            ? "cursor-not-allowed opacity-50 shadow-none contrast-50"
            : "cursor-pointer hover:brightness-120 active:brightness-150"),
        className,
      )}
      onClick={(e) => {
        onClick?.();
        e.currentTarget.blur();
      }}
      type={type}
      onMouseEnter={setTooltip}
      onMouseLeave={closeTooltip}>
      {hotkey && (
        <img
          src={`/input-prompts/keyboard_${hotkey.split(",")[0]}_outline.svg`}
          className="-ml-1 max-h-6"
        />
      )}
      {label}
    </button>
  );
};
