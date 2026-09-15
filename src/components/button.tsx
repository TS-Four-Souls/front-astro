import { cn } from "@/utils/cn";
import { HotkeyScope, shouldUseKey } from "@/utils/hotkey";
import { useHotkeys } from "react-hotkeys-hook";
import { type Tooltip, useTooltip } from "./board/use-tooltip";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

/** Last pointer position — remounted nodes often don't match :hover until the mouse moves. */
const lastPointer = { x: -1, y: -1 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    { passive: true },
  );
  window.addEventListener(
    "pointerdown",
    (e) => {
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
    },
    { passive: true },
  );
}

const isPointerOver = (el: Element) => {
  if (lastPointer.x >= 0 && lastPointer.y >= 0) {
    const hit = document.elementFromPoint(lastPointer.x, lastPointer.y);
    if (hit === el || el.contains(hit)) return true;
  }
  return el.matches(":hover");
};

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
        "relative flex shrink-0 place-content-center place-items-center gap-2 overflow-hidden rounded-md px-4 py-2 font-main text-white uppercase shadow-2xl inset-shadow-xs shadow-taupe-950/10 inset-shadow-taupe-100/10 transition-[colors,filter]",
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

interface ImgButtonProps {
  backgroundImage: string;
  frontImage: string;
  frontImageAlt?: string;
  frontHoverImage?: string;
  frontHoverImageAlt?: string;
  size?: number | string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** Applied only when the button is enabled (e.g. hover rotation). */
  enabledClassName?: string;
  frontImageClassName?: string;
  hotkey?: string;
  hotkeyScope?: HotkeyScope[];
  type?: "button" | "submit" | "reset" | undefined;
  tooltip?: Tooltip;
}

export const ImgButton = ({
  backgroundImage,
  frontImage,
  frontImageAlt = "",
  frontHoverImage,
  frontHoverImageAlt = "",
  size,
  onClick,
  disabled,
  className,
  enabledClassName,
  frontImageClassName,
  hotkey,
  hotkeyScope = [HotkeyScope.Main],
  type = undefined,
  tooltip: tooltipProps,
}: ImgButtonProps) => {
  useHotkeys(hotkey ?? "enter", () => onClick?.(), {
    scopes: hotkeyScope,
    enabled: onClick !== undefined && hotkey !== undefined,
    useKey: shouldUseKey(hotkey ?? ""),
  });

  const tooltip = useMemo<Tooltip | undefined>(() => {
    if (!tooltipProps) return undefined;
    if (onClick === undefined || hotkey === undefined) return tooltipProps;
    return { ...tooltipProps, hotkey };
  }, [tooltipProps, onClick, hotkey]);

  const { setTooltip, closeTooltip } = useTooltip(tooltip);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showHoverImage = Boolean(frontHoverImage && onClick && !disabled);

  // Remounts under the cursor skip mouseEnter; reopen after sibling unmount cleanups.
  const syncTooltipIfPointerOver = () => {
    const el = buttonRef.current;
    if (!el || !isPointerOver(el)) return;
    setTooltip(el);
  };
  useLayoutEffect(syncTooltipIfPointerOver, [
    setTooltip,
    frontImage,
    frontHoverImage,
    tooltip,
  ]);
  useEffect(syncTooltipIfPointerOver, [
    setTooltip,
    frontImage,
    frontHoverImage,
    tooltip,
  ]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative block shrink-0 overflow-hidden border-0 bg-transparent p-0 transition-[scale,rotate] ease-out-back",
        showHoverImage && "group",
        onClick &&
          (disabled
            ? "cursor-not-allowed opacity-50 contrast-50"
            : "cursor-pointer hover:scale-110 hover:rotate-5 active:brightness-120"),
        className,
        onClick && !disabled && enabledClassName,
      )}
      onClick={(e) => {
        lastPointer.x = e.clientX;
        lastPointer.y = e.clientY;
        onClick?.();
        e.currentTarget.blur();
      }}
      type={type}
      style={size !== undefined ? { width: size, height: size } : undefined}
      onMouseEnter={setTooltip}
      onMouseLeave={(e) => {
        // Remount removes the node and synthesizes mouseleave — don't kill the replacement's tooltip.
        if (!e.currentTarget.isConnected) return;
        closeTooltip();
      }}>
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className={cn(
          "block",
          size === undefined ? "max-w-full" : "size-full object-fill",
        )}
      />
      <img
        src={frontImage}
        alt={frontImageAlt}
        className={cn(
          "absolute inset-0 size-full object-contain",
          showHoverImage && "group-hover:opacity-0",
          frontImageClassName,
        )}
      />
      {showHoverImage && (
        <img
          src={frontHoverImage}
          alt={frontHoverImageAlt}
          className={cn(
            "absolute inset-0 size-full object-contain opacity-0 group-hover:opacity-100",
            frontImageClassName,
          )}
        />
      )}
    </button>
  );
};
