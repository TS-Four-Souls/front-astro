import {
  ThreeDMode,
  ZoomResolutionPreset,
} from "./components/board/contexts/user-settings-context";

/** Allow the user to draw treasures and loot cards from the decks */
export const CHEAT_MODE: boolean = false;

export const DEFAULT_ZOOM_RESOLUTION_PRESET: ZoomResolutionPreset =
  ZoomResolutionPreset.LOW;

export const DEFAULT_3D_MODE: ThreeDMode = ThreeDMode.SIMPLE;

export const CARD_RADIUS: number = 5;
