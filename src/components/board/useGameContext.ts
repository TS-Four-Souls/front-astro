import type { DetailedState, Issuer } from "@/shared/api";
import { createContext, useContext, useState } from "react";

interface GameContextProps {
  state: DetailedState;
  issuer: Issuer;
}

export const GameContext = createContext<GameContextProps>({
  state: {} as DetailedState,
  issuer: {} as Issuer,
});

export const useGameContext = () => {
  return useContext(GameContext);
};