import { PlayerStats } from "./player-stats";
import { cn } from "../../utils/cn";
import { Center } from "./center";
import { Pile } from "./pile";
import { useRef } from "react";
import { useCssOrbitControls } from "./use-css-orbit-controls";
import { Card, CardType } from "./card";
import type { DetailedState } from "@/shared/api";

interface BoardProps {
  state: DetailedState;
}

export const Board = ({ state }: BoardProps) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useCssOrbitControls(parentRef, boardRef, {
    rotateSpeed: 0.2,
    panSpeed: 1,
    zoomSpeed: 0.15,
  });

  return (
    <>
      <div
        ref={parentRef}
        className="relative h-screen w-screen overflow-hidden bg-stone-800 select-none perspective-[60vmax] perspective-origin-center"
      >
        <div
          ref={boardRef}
          className="absolute top-1/2 left-1/2 grid h-max w-max -translate-x-1/2 -translate-y-1/2 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] p-6 pb-24 transform-3d"
        >
          <div className="col-start-2 row-start-3 mt-24 flex place-content-center transform-3d">
            <PlayerStats
              name={state.me.name}
              coins={state.me.coins}
              health={state.me.currentHealthPoints}
              attack={state.me.currentAttackPoints}
              souls={state.me.souls}
            />
            <div className="flex gap-1 transform-3d">
              {state.me.inPlay.map((card) => (
                <Pile key={card.slug} cards={[card]} />
              ))}
            </div>
          </div>
          {state.players.map((player, index) => {
            let className;
            let horizontal;
            let right;
            if (state.players.length === 1) {
              className = "col-start-2 row-start-1";
              horizontal = true;
            } else if (state.players.length === 2) {
              className = [
                "col-start-1 row-start-1 row-span-3 mr-24",
                "col-start-3 row-start-1 row-span-3 ml-24",
              ][index];
              horizontal = false;
              right = index === 1;
            } else {
              className = [
                "col-start-1 row-start-1 row-span-3 mr-24",
                "col-start-2 row-start-1 mb-24",
                "col-start-3 row-start-1 row-span-3 ml-24",
              ][index];
              horizontal = index === 1;
              right = index === 2;
            }

            return (
              <div
                key={player.name}
                className={cn(
                  className,
                  "flex place-content-center gap-8 transform-3d",
                  horizontal ? "flex-row" : "flex-col",
                  right ? "items-end text-right" : "items-start text-left",
                )}
              >
                <PlayerStats
                  name={player.name}
                  coins={player.coins}
                  health={player.currentHealthPoints}
                  attack={player.currentAttackPoints}
                  souls={player.souls}
                />
                <div
                  className={cn(
                    "flex flex-wrap gap-1 transform-3d",
                    !horizontal && player.inPlay.length <= 3
                      ? "flex-col"
                      : right && "flex-row-reverse",
                  )}
                >
                  {player.inPlay.map((card) => (
                    <Pile key={card.slug} cards={[card]} size={144} />
                  ))}
                </div>
                {player.handSize > 0 && (
                  <div
                    className={cn(
                      "grid place-items-center transform-3d",
                      right ? "place-self-end" : "place-self-start",
                    )}
                  >
                    <Pile
                      key={index}
                      cards={Array.from({ length: player.handSize }).map(
                        () => CardType.LootCard,
                      )}
                      size={120}
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div className="col-start-2 row-start-2 flex place-content-center place-items-center transform-3d">
            <Center state={state} />
          </div>
        </div>
      </div>
      <div className="fixed right-0 bottom-0 left-0 flex place-content-center place-items-center gap-4 text-[16px] pointer-events-none">
        <div className="flex gap-4 translate-y-3/4 duration-600 hover:translate-y-0 hover:blur-none transition-transform pointer-events-auto">
          {state.me.hand.map((card) => (
            <Card key={card.slug} card={card} className="shadow-3xl/100 hover:-translate-y-10 transition-transform duration-300 cursor-pointer rounded-lg overflow-hidden" style={{ height: "30vh" }} />
          ))}
        </div>
      </div>
    </>
  );
};
