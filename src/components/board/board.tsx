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
          className="absolute top-1/2 left-1/2 grid h-max w-max -translate-x-1/2 -translate-y-1/2 grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto] p-6 pb-40 transform-3d">
          <Me />
          {state.players.map((player, index) => {
            let className;
            let horizontal;
            let right;
            if (state.players.length === 1) {
              className = "col-start-2 row-start-1";
              horizontal = true;
            } else if (state.players.length === 2) {
              className = [
                "col-start-1 row-start-1 row-span-3",
                "col-start-3 row-start-1 row-span-3",
              ][index];
              horizontal = false;
              right = index === 1;
            } else {
              className = [
                "col-start-1 row-start-1 row-span-3",
                "col-start-2 row-start-1",
                "col-start-3 row-start-1 row-span-3",
              ][index];
              horizontal = index === 1;
              right = index === 2;
            }

            return (
              <div
                key={player.name}
                className={cn(
                  className,
                  "flex place-content-center place-items-center gap-8 transform-3d",
                  horizontal ? "flex-row" : "flex-col",
                )}>
                {player.handSize > 0 && (
                  <div className="grid place-items-center transform-3d">
                    <Pile
                      key={index}
                      cards={Array.from({ length: player.handSize }).map(
                        () => CardType.LootCard,
                      )}
                      className="col-start-1 row-start-1"
                      size={120}
                    />
                    <p
                      className={cn(
                        "col-start-1 row-start-1 translate-z-1 text-center text-6xl font-black text-stone-950 text-shadow-amber-50 text-shadow-lg",
                        player.handSize >= 10 && "translate-z-2 text-5xl",
                      )}>
                      {player.handSize}
                    </p>
                  </div>
                )}
                <PlayerStats
                  name={player.name}
                  coins={player.coins}
                  health={player.currentHealthPoints}
                  attack={player.currentAttackPoints}
                  souls={player.souls}
                  isEngagedInCombat={player.isEngagedInCombat}
                />
                <div
                  className={cn(
                    "grid gap-2 transform-3d",
                    horizontal ? "grid-flow-row" : "grid-flow-col",
                  )}
                  style={{
                    gridTemplateColumns: horizontal
                      ? `repeat(${Math.min(player.inPlay.length, 7)}, 1fr)`
                      : undefined,
                    gridTemplateRows: horizontal
                      ? undefined
                      : `repeat(${Math.min(player.inPlay.length, 3)}, 1fr)`,
                  }}>
                  {player.inPlay.map((card) => (
                    <Pile key={card.slug} cards={[card]} />
                  ))}
                </div>
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
