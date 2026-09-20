import { EmoteType } from "@/shared/api";
import { socket } from "@/utils/socket";
import { useEffect, useState } from "react";
import { EMOTE_ASSETS } from "./emotes";

const DISPLAY_MS = 4000;

export const useDisplayedEmote = (playerName: string) => {
  const [emote, setEmote] = useState<{
    type: EmoteType;
    key: number;
  } | null>(null);

  useEffect(() => {
    const onPlayerEmote = (type: EmoteType, name: string) => {
      if (name !== playerName) return;
      setEmote({ type, key: Date.now() });
    };

    socket.on("on:player:emote", onPlayerEmote);
    return () => {
      socket.off("on:player:emote", onPlayerEmote);
    };
  }, [playerName]);

  useEffect(() => {
    if (!emote) return;
    const timeout = window.setTimeout(() => setEmote(null), DISPLAY_MS);
    return () => window.clearTimeout(timeout);
  }, [emote]);

  return emote;
};

interface EmoteBubbleProps {
  type: EmoteType;
}

export const EmoteBubble = ({ type }: EmoteBubbleProps) => {
  const src = EMOTE_ASSETS[type];
  if (!src) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-full left-full z-40 mb-1 w-28 origin-bottom-left -translate-x-5 animate-emote-pop"
      role="img"
      aria-label={type}>
      <img
        src="/emotes/bubble.png"
        alt=""
        draggable={false}
        className="w-full drop-shadow-md"
      />
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute top-[5%] left-[15%] h-[70%] w-[75%] object-contain"
      />
    </div>
  );
};
