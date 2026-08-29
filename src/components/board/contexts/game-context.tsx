import type { DetailedState, GameParametersJson } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface GameContextProps {
  state: DetailedState;
  parameters: GameParametersJson;
  isSpectator: boolean;
  isHandUp: boolean;
  setIsHandUp: (isHandUp: boolean) => void;
}

const GameContext = createContext<GameContextProps>({
  state: undefined as unknown as DetailedState,
  parameters: undefined as unknown as GameParametersJson,
  isSpectator: false,
  isHandUp: false,
  setIsHandUp: () => {},
});

interface GameProviderProps {
  children: React.ReactNode;
  state: DetailedState;
  parameters: GameParametersJson;
  isSpectator?: boolean;
}

export const GameProvider = ({
  children,
  state,
  parameters,
  isSpectator = false,
}: GameProviderProps) => {
  const [isHandUp, setIsHandUp] = useState(false);
  useHotkeys("shift", (e) => setIsHandUp(e.type === "keydown"), {
    scopes: [HotkeyScope.Main],
    keydown: true,
    keyup: true,
  });

  return (
    <GameContext.Provider
      value={{ state, parameters, isSpectator, isHandUp, setIsHandUp }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
