import type { DetailedState, Issuer } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface GameContextProps {
  state: DetailedState;
  issuer: Issuer;
  isHandUp: boolean;
  setIsHandUp: (isHandUp: boolean) => void;
}

const GameContext = createContext<GameContextProps>({
  state: {} as DetailedState,
  issuer: {} as Issuer,
  isHandUp: false,
  setIsHandUp: () => {},
});

interface GameProviderProps {
  children: React.ReactNode;
  state: DetailedState;
  issuer: Issuer;
}

export const GameProvider = ({
  children,
  state,
  issuer,
}: GameProviderProps) => {
  const [isHandUp, setIsHandUp] = useState(false);
  useHotkeys("shift", (e) => setIsHandUp(e.type === "keydown"), {
    scopes: [HotkeyScope.Main],
    keydown: true,
    keyup: true,
  });

  return (
    <GameContext.Provider value={{ state, issuer, isHandUp, setIsHandUp }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
