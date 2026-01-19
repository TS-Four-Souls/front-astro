import type { DetailedState, Issuer } from "@/shared/api";
import { createContext, useContext } from "react";

interface GameContextProps {
  state: DetailedState;
  issuer: Issuer;
}

const GameContext = createContext<GameContextProps>({
  state: {} as DetailedState,
  issuer: {} as Issuer,
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
  return (
    <GameContext.Provider value={{ state, issuer }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  return useContext(GameContext);
};
