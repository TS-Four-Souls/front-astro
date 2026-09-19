import { EmoteType } from "@/shared/api";

export const EMOTE_ASSETS: Record<EmoteType, string> = {
  [EmoteType.HurryUp]: "/Emote_BroTime.png",
  [EmoteType.HappIsaac]: "/Emote_Saac.png",
  [EmoteType.SadIsaac]: "/Emote_DeadInside.png",
  [EmoteType.Gamble]: "/Emote_Gambling.png",
};

export const EMOTES = Object.values(EmoteType).map((type) => ({
  type,
  src: EMOTE_ASSETS[type],
}));
