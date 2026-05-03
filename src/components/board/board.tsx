import { Center } from "./center";
import { useRef } from "react";
import { useGameContext } from "./contexts/game-context";
import { Me } from "./players/me";
import { TopPlayer } from "./players/topPlayer";
import { LeftPlayer } from "./players/leftPlayer";
import { RightPlayer } from "./players/rightPlayer";
import { cn } from "@/utils/cn";
import { HistoryProvider } from "./contexts/history-context";
import { useAutofit } from "./use-autofit";

export const Board = () => {
  const { state } = useGameContext();

  const boardRef = useRef<HTMLDivElement | null>(null);

  useAutofit(boardRef);

  return (
    <HistoryProvider>
      <div className="relative flex h-screen items-center justify-center overflow-hidden">
        <div
          ref={boardRef}
          className={cn(
            "grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] place-items-center gap-4 p-6 pb-2",
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
          <div className="col-start-2 row-start-2">
            <Center state={state} />
          </div>
        </div>
      </div>
    </HistoryProvider>
  );
};
