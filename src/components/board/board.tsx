import { PlayerStats } from "./player-stats";
import { cn } from "../../utils/cn";
import { Center } from "./center";
import { Pile } from "./pile";
import { useRef } from "react";
import { useCssOrbitControls } from "./use-css-orbit-controls";
import { CardType } from "./card";
import { useGameContext } from "./contexts/game-context";
import { Hand } from "./hand";
import { Me } from "./me";

export const Board = () => {
  const { state } = useGameContext();

  const boardRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useCssOrbitControls(parentRef, boardRef, {
    rotateSpeed: 0.2,
    zoomSpeed: 0.15,
  });

  return (
    <>
      <div
        ref={parentRef}
        className="relative h-screen w-screen overflow-hidden bg-stone-800 select-none perspective-[60vmax] perspective-origin-center">
        <div
          ref={boardRef}
          className="absolute top-1/2 left-1/2 grid h-max w-max -translate-x-1/2 -translate-y-1/2 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] p-6 pb-24 transform-3d">
          <Me />
          {state.players.map((player, index) => {
            let className;
            let horizontal;
            let right;
            if (state.players.length === 1) {
              className = "col-start-2 row-start-1 mb-24";
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
                )}>
                <PlayerStats
                  name={player.name}
                  coins={player.coins}
                  health={player.currentHealthPoints}
                  attack={player.currentAttackPoints}
                  souls={player.souls}
                />
                <div
                  className={cn(
                    "flex flex-wrap gap-2 transform-3d",
                    horizontal ? "max-w-275" : "max-h-200",
                  )}>
                  {player.inPlay.map((card) => (
                    <Pile key={card.slug} cards={[card]} />
                  ))}
                </div>
                {player.handSize > 0 && (
                  <div
                    className={cn(
                      "grid place-items-center transform-3d",
                      right ? "place-self-end" : "place-self-start",
                    )}>
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
      <Hand />
    </>
  );
};
