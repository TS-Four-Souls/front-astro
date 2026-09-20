import { EmoteType } from "@/shared/api";

export const EMOTE_ASSETS: Record<EmoteType, string> = {
  [EmoteType.HurryUp]: "/emotes/hurry-up.png",
  [EmoteType.HappIsaac]: "/emotes/happy-isaac.png",
  [EmoteType.SadIsaac]: "/emotes/sad-isaac.png",
  [EmoteType.Gamble]: "/emotes/gamble.png",
};

export const EMOTES = Object.values(EmoteType).map((type) => ({
  type,
  src: EMOTE_ASSETS[type],
}));
