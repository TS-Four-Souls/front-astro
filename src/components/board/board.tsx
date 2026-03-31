import { Center } from "./center";
import { useRef } from "react";
import { useCssOrbitControls } from "./use-css-orbit-controls";
import { useGameContext } from "./contexts/game-context";
import { Hand } from "./hand";
import { Me } from "./players/me";
import { TopPlayer } from "./players/topPlayer";
import { LeftPlayer } from "./players/leftPlayer";
import { RightPlayer } from "./players/rightPlayer";
import { cn } from "@/utils/cn";
import { HistoryProvider } from "./contexts/history-context";
import { BoardSelectionProvider } from "./contexts/board-selection-context";

export const Board = () => {
  const { state } = useGameContext();

  const boardRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useCssOrbitControls(parentRef, boardRef, {
    rotateSpeed: 0.2,
    zoomSpeed: 0.15,
  });

  return (
    <HistoryProvider>
      <BoardSelectionProvider>
        <div
          ref={parentRef}
          className="relative h-screen w-screen overflow-hidden select-none perspective-[60vmax] perspective-origin-center">
          <div
            ref={boardRef}
            className={cn(
              "absolute top-1/2 left-1/2 grid h-max w-max -translate-x-1/2 -translate-y-1/2 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] gap-4 p-6 pb-40 transform-3d",
              state.players.length === 1 && "gap-x-0",
            )}>
            <Me />
            {state.players.map((player, index) => {
              if (state.players.length === 1) {
                return <TopPlayer player={player} />;
              } else if (state.players.length === 2) {
                if (index === 0) {
                  return <LeftPlayer player={player} />;
                } else if (index === 1) {
                  return <RightPlayer player={player} />;
                }
              } else {
                if (index === 0) {
                  return <LeftPlayer player={player} />;
                } else if (index === 1) {
                  return <TopPlayer player={player} />;
                } else if (index === 2) {
                  return <RightPlayer player={player} />;
                }
              }

              return null;
            })}
            <div className="col-start-2 row-start-2 flex place-content-center place-items-center transform-3d">
              <Center state={state} />
            </div>
          </div>
        </div>
        <Hand />
      </BoardSelectionProvider>
    </HistoryProvider>
  );
};
