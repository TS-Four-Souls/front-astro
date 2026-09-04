import type {
  DetailedState,
  GameParametersJson,
  IdentifierType,
} from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { createContext, useContext, useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface GameContextProps {
  state: DetailedState;
  parameters: GameParametersJson;
  isHandUp: boolean;
  setIsHandUp: (isHandUp: boolean) => void;
  isCheatViewOpen: boolean;
  setIsCheatViewOpen: (isCheatViewOpen: boolean) => void;
  cheatRemovableCards: Set<IdentifierType>;
}

const GameContext = createContext<GameContextProps>({
  state: undefined as unknown as DetailedState,
  parameters: undefined as unknown as GameParametersJson,
  isHandUp: false,
  setIsHandUp: () => {},
  isCheatViewOpen: false,
  setIsCheatViewOpen: () => {},
  cheatRemovableCards: new Set(),
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
  const [cheatRemovableCards, setCheatRemovableCards] = useState<
    Set<IdentifierType>
  >(new Set());
  useHotkeys("shift", (e) => setIsHandUp(e.type === "keydown"), {
    scopes: [HotkeyScope.Main],
    keydown: true,
    keyup: true,
  });

  useEffect(() => {
    if (isCheatViewOpen) {
      socket.emit("debugListCardsICanRemove", (response) => {
        if (response.status === 200) {
          setCheatRemovableCards(new Set(response.cards));
        } else {
          setCheatRemovableCards(new Set());
        }
      });
    } else setCheatRemovableCards(new Set());
  }, [state, isCheatViewOpen]);

  return (
    <GameContext.Provider
      value={{
        state,
        parameters,
        isHandUp,
        setIsHandUp,
        isCheatViewOpen,
        setIsCheatViewOpen,
        cheatRemovableCards,
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
