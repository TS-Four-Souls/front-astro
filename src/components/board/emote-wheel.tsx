import { useLanguageContext } from "@/components/contexts/language-context";
import { EmoteType } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useEffect } from "react";
import { useHotkeys, useHotkeysContext } from "react-hotkeys-hook";
import { useToastContext } from "./contexts/toast-context";
import { EMOTES } from "./emotes";

interface EmoteWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmoteWheel = ({ open, onOpenChange }: EmoteWheelProps) => {
  const hotkeys = useHotkeysContext();
  const { toast } = useToastContext();
  const { translateError } = useLanguageContext();

  const sendEmote = (emote: EmoteType) => {
    onOpenChange(false);
    socket.emit("emote", { emote }, (response) => {
      if (response.status === 400) {
        toast("error", "Failed to send emote", translateError(response.error));
      }
    });
  };

  useEffect(() => {
    if (!open) return;

    hotkeys.disableScope(HotkeyScope.Main);
    hotkeys.enableScope(HotkeyScope.Emote);

    return () => {
      hotkeys.enableScope(HotkeyScope.Main);
      hotkeys.disableScope(HotkeyScope.Emote);
    };
  }, [open]);

  useHotkeys(
    "r",
    () => onOpenChange(true),
    {
      scopes: [HotkeyScope.Main],
      enabled: !open,
      useKey: true,
    },
    [open, onOpenChange],
  );

  useHotkeys(
    "r",
    () => onOpenChange(false),
    {
      scopes: [HotkeyScope.Emote],
      enabled: open,
      useKey: true,
    },
    [open, onOpenChange],
  );

  useHotkeys(
    "escape",
    () => onOpenChange(false),
    {
      scopes: [HotkeyScope.Emote],
      enabled: open,
    },
    [open, onOpenChange],
  );

  useHotkeys(
    EMOTES.map((_, index) => `${index + 1}`).join(","),
    (event) => {
      const emote = EMOTES[Number(event.key) - 1];
      if (!emote) return;
      sendEmote(emote.type);
    },
    {
      scopes: [HotkeyScope.Emote],
      enabled: open,
    },
    [open, onOpenChange],
  );

  if (!open) return null;

  const radius = 78;

  return (
    <>
      <button
        type="button"
        aria-label="Close emote wheel"
        className="fixed inset-0 z-40 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="absolute top-1/2 left-full z-50 ml-2 size-56 -translate-y-1/2"
        role="menu"
        aria-label="Emotes">
        <div className="absolute inset-3 overflow-hidden rounded-full bg-taupe-950/70 shadow-4xl/40 outline-3 outline-taupe-700 backdrop-blur-md" />
        {EMOTES.map((emote, index) => {
          const angle = (index / EMOTES.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const hotkey = `${index + 1}`;
          const inwardX = -Math.cos(angle);
          const inwardY = -Math.sin(angle);
          const badgeOffset = 42;

          return (
            <div
              key={emote.type}
              className="absolute size-20 -translate-1/2"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}>
              <button
                type="button"
                role="menuitem"
                aria-label={emote.type}
                className={cn(
                  "relative size-full cursor-pointer overflow-hidden rounded-full transition-transform duration-100",
                  "hover:scale-110 active:scale-95",
                )}
                onClick={() => sendEmote(emote.type)}>
                <img
                  src={emote.src}
                  alt=""
                  draggable={false}
                  className="size-full origin-center object-contain"
                />
              </button>
              <div
                className="pointer-events-none absolute z-10 flex size-5 -translate-1/2 place-items-center overflow-hidden rounded-sm bg-taupe-700 outline-[0.1em]"
                style={{
                  left: `calc(50% + ${inwardX * badgeOffset}px)`,
                  top: `calc(50% + ${inwardY * badgeOffset}px)`,
                }}>
                <img
                  src={`/input-prompts/keyboard_${hotkey}_outline.svg`}
                  className="scale-150"
                  alt=""
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
