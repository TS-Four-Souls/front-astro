import { Board } from "../board/board";
import { GameProvider } from "../board/contexts/game-context";
import { MainMenuProvider } from "../board/contexts/main-menu-context";
import { BoardSelectionProvider } from "../board/contexts/board-selection-context";
import type { DetailedState } from "@/shared/api";
import { useState } from "react";
import { OnboardingLayout } from "../onboarding-layout";
import { Button } from "../button";

export const ReplayPage = () => {
  const [text, setText] = useState<string>("");
  const [gameState, setGameState] = useState<DetailedState | null>(null);

  if (!gameState) {
    return (
      <OnboardingLayout withHeader={true}>
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Replay</h1>
          <textarea
            className="h-[50vh] w-[50vw] rounded-lg bg-taupe-500 p-4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            placeholder="Paste a detailed state JSON here..."></textarea>
          <Button
            onClick={() => {
              const gameState = JSON.parse(text) as DetailedState;
              setGameState(gameState);
            }}
            hotkey="enter"
            label="Let's go!"
            className="h-16 w-120 font-alt-stats text-xl font-bold"
          />
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <GameProvider state={gameState}>
      <BoardSelectionProvider>
        <MainMenuProvider>
          <Board />
        </MainMenuProvider>
      </BoardSelectionProvider>
    </GameProvider>
  );
};
