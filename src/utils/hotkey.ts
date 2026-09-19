export enum HotkeyScope {
  Main = "main",
  Popup = "popup",
  Selection = "selection",
  Emote = "emote",
}

/** Return true if the hotkey is a single letter */
export const shouldUseKey = (hotkey: string): boolean => {
  return hotkey.length === 1 && hotkey.match(/[a-z]/i) !== null;
};
