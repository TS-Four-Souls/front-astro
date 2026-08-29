import type { DetailedState, GameParametersJson } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface GameContextProps {
  state: DetailedState;
  parameters: GameParametersJson;
  isHandUp: boolean;
  setIsHandUp: (isHandUp: boolean) => void;
  isCheatViewOpen: boolean;
  setIsCheatViewOpen: (isCheatViewOpen: boolean) => void;
}

const GameContext = createContext<GameContextProps>({
  state: undefined as unknown as DetailedState,
  parameters: undefined as unknown as GameParametersJson,
  isHandUp: false,
  setIsHandUp: () => {},
  isCheatViewOpen: false,
  setIsCheatViewOpen: () => {},
});

interface GameProviderProps {
  children: React.ReactNode;
  state: DetailedState;
  parameters: GameParametersJson;
}

export const GameProvider = ({
  children,
  state,
  parameters,
}: GameProviderProps) => {
  const [isHandUp, setIsHandUp] = useState(false);
  const [isCheatViewOpen, setIsCheatViewOpen] = useState(false);
  useHotkeys("shift", (e) => setIsHandUp(e.type === "keydown"), {
    scopes: [HotkeyScope.Main],
    keydown: true,
    keyup: true,
  });

  return (
    <GameContext.Provider
      value={{
        state,
        parameters,
        isHandUp,
        setIsHandUp,
        isCheatViewOpen,
        setIsCheatViewOpen,
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
