import { Popup } from "@/components/popup";
import { cn } from "@/utils/cn";
import { useLocalStorage } from "@/utils/use-local-storage";
import { createContext, useContext, useState } from "react";

export enum ZoomResolutionPreset {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  VERY_LOW = "veryLow",
}

const presets = [
  { label: "High", value: ZoomResolutionPreset.HIGH },
  { label: "Medium", value: ZoomResolutionPreset.MEDIUM },
  { label: "Low", value: ZoomResolutionPreset.LOW },
  { label: "Very low", value: ZoomResolutionPreset.VERY_LOW },
];

interface UserSettingsContextProps {
  zoomResolutionPreset: ZoomResolutionPreset;
  enable3D: boolean;
  enableCardSides: boolean;
  openMenu: () => void;
}

export const UserSettingsContext = createContext<UserSettingsContextProps>({
  zoomResolutionPreset: ZoomResolutionPreset.HIGH,
  enable3D: true,
  enableCardSides: true,
  openMenu: () => { },
});

interface UserSettingsProviderProps {
  children: React.ReactNode;
}

export const UserSettingsProvider = ({
  children,
}: UserSettingsProviderProps) => {
  const [zoomResolutionPreset, setZoomResolutionPreset] = useLocalStorage<ZoomResolutionPreset>(
    "zoom-resolution-preset",
    ZoomResolutionPreset.MEDIUM,
  );
  const [threeDMode, setThreeDMode] = useLocalStorage<"full" | "simple" | "disabled">("3d-mode", "simple");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <UserSettingsContext.Provider
      value={{
        zoomResolutionPreset: zoomResolutionPreset,
        enable3D: threeDMode !== "disabled",
        enableCardSides: threeDMode === "full",
        openMenu: () => setIsMenuOpen(true),
      }}>
      {children}
      {isMenuOpen && (
        <Popup onPressBackdrop={() => setIsMenuOpen(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">User settings</h1>
              <button className="cursor-pointer rounded-md px-2 py-1 transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setIsMenuOpen(false)}>Close</button>
            </div>
            <h2 className="text-2xl font-bold">Zoom resolution</h2>
            <p className="text-sm leading-normal max-w-200 text-stone-300">
              Adjust how much the resolution increases with zooming.<br />
              If the cards are blurry when zooming in, try increasing this preset.<br />
              If the game is laggy or the cards flicker in and out of existence, try decreasing this preset.
              <br />
              This has little effect when 3D is disabled.
              <br />
              Additionally, <strong>very low</strong> will reduce how much you can zoom in and how many cards are rendered in piles.
            </p>
            <div className="flex flex-row gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-1 transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50",
                    zoomResolutionPreset === preset.value
                      ? "bg-stone-300 text-stone-900"
                      : "bg-stone-600 text-stone-100",
                  )}
                  key={preset.value}
                  onClick={() => setZoomResolutionPreset(preset.value)}>
                  {preset.label}
                </button>
              ))}
            </div>
            <h2 className="text-2xl font-bold mt-4">3D settings</h2>
            <p className="text-sm leading-normal text-stone-300 max-w-200">With <strong>full 3D</strong>, the cards are rendered as 3D objects and with better lighting effects.
              <br />
              With <strong>simple 3D</strong>, the cards are still positioned in 3D space but they are floating 2D images.
              <br />
              With <strong>disabled 3D</strong>, the camera can no longer be rotated. Piles of cards are simplified improving performance and reducing video memory usage.
            </p>
            <div className="flex flex-row gap-2 mt-2">
              <button
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50",
                  threeDMode === "full"
                    ? "bg-stone-300 text-stone-900"
                    : "bg-stone-600 text-stone-100",
                )}
                onClick={() => setThreeDMode("full")}>
                Full
              </button>
              <button
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50",
                  threeDMode === "simple"
                    ? "bg-stone-300 text-stone-900"
                    : "bg-stone-600 text-stone-100",
                )}
                onClick={() => setThreeDMode("simple")}>
                Simple
              </button>
              <button
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50",
                  threeDMode === "disabled"
                    ? "bg-stone-300 text-stone-900"
                    : "bg-stone-600 text-stone-100",
                )}
                onClick={() => setThreeDMode("disabled")}>
                Disabled
              </button>
            </div>
          </div>
        </Popup>
      )}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettingsContext = () => {
  return useContext(UserSettingsContext);
};
