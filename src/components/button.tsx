import { cn } from "@/utils/cn";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { type Tooltip, useTooltip } from "./board/use-tooltip";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  label?: string;
  hotkey?: string;
  hotkeyScope?: HotkeyScope[];
  type?: "button" | "submit" | "reset" | undefined;
  theme?: "default" | "onLight" | "onDark";
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
        "flex place-content-center place-items-center gap-2 rounded-md px-4 py-2 font-main text-white uppercase shadow-2xl shadow-stone-950/10 transition-colors",
        onClick &&
          (disabled
            ? "cursor-not-allowed brightness-40 contrast-60"
            : "cursor-pointer transition-[filter] hover:brightness-120"),
        theme === "default" && "bg-stone-600",
        theme === "onLight" && "bg-stone-500",
        theme === "onDark" && "bg-stone-800",
        active ? "bg-stone-300 text-stone-900" : "",
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
