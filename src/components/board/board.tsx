import { Center } from "./center";
import { useGameContext } from "./contexts/game-context";
import { Me } from "./players/me";
import { TopPlayer } from "./players/topPlayer";
import { LeftPlayer } from "./players/leftPlayer";
import { RightPlayer } from "./players/rightPlayer";
import { cn } from "@/utils/cn";
import { useBoardView } from "./contexts/board-scale-context";
import { HistoryProvider } from "./contexts/history-context";
import { useGameAnimation } from "./contexts/game-animation";
import { Button } from "../button";
import { HotkeyScope } from "@/utils/hotkey";
import { useLanguageContext } from "../contexts/language-context";

export const Board = () => {
  const { state } = useGameContext();
  const { t } = useLanguageContext();
  const { registerBoard, registerViewport, zoomed, resetView } = useBoardView();
  const { registerAnimationRoot } = useGameAnimation();

  return (
    <HistoryProvider>
      <div className="board-light relative h-full w-full overflow-hidden">
        <div
          ref={registerViewport}
          className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden bg-[#222]">
          <div
            ref={registerBoard}
            className={cn(
              "relative grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] place-items-center gap-2 p-2",
              state.players.length === 1 && "gap-x-0",
            )}>
            <div
              data-board-background
              className="board-texture pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2"
            />
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
              <Center />
            </div>
            <div
              ref={registerAnimationRoot}
              className="pointer-events-none absolute inset-0 z-50"
            />
          </div>
          {zoomed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center">
              <div data-reset-view className="pointer-events-auto">
                <Button
                  hotkey="c"
                  hotkeyScope={[HotkeyScope.Main]}
                  onClick={resetView}
                  label={(t as (key: string) => string)("gameStep.resetView")}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </HistoryProvider>
  );
};
