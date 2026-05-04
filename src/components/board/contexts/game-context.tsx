import type { DetailedState } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface GameContextProps {
  state: DetailedState;
  isHandUp: boolean;
  setIsHandUp: (isHandUp: boolean) => void;
}

const GameContext = createContext<GameContextProps>({
  state: undefined as unknown as DetailedState,
  isHandUp: false,
  setIsHandUp: () => {},
});

interface GameProviderProps {
  children: React.ReactNode;
  state: DetailedState;
}

export const GameProvider = ({ children, state }: GameProviderProps) => {
  const [isHandUp, setIsHandUp] = useState(false);
  useHotkeys("shift", (e) => setIsHandUp(e.type === "keydown"), {
    scopes: [HotkeyScope.Main],
    keydown: true,
    keyup: true,
  });

  return (
    <GameContext.Provider value={{ state, isHandUp, setIsHandUp }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
