import type { InPlayCard, Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { HandPile } from "../hand-pile";
import { OthersInPlays } from "./othersInPlays";

interface TopPlayerProps {
  player: Player;
}

const MAX_COLUMNS = 8;

export const TopPlayer = ({ player }: TopPlayerProps) => {
  // Create an array of arrays of 8 elements each, fill with undefined if needed
  const grid: InPlayCard[][] = Array.from(
    { length: Math.ceil((player.inPlay.length + 1) / MAX_COLUMNS) },
    () =>
      Array(Math.min(player.inPlay.length + 1, MAX_COLUMNS)).fill(undefined),
  );

  grid[0][0] = player.character;
  // Fill the grid with the cards
  for (let i = 1; i < player.inPlay.length + 1; i++) {
    grid[Math.floor(i / MAX_COLUMNS)][i % MAX_COLUMNS] = player.inPlay[i - 1];
  }

  // Turn back into a flat array
  const cards = grid.toReversed().flat();

  return (
    <div
      key={player.name}
      className={
        "col-start-2 row-start-1 flex flex-col-reverse place-content-center place-items-center gap-6"
      }>
      <PlayerStats player={player} className={"flex-row gap-12 px-8 py-3"} />
      <div className={"flex place-content-center place-items-center gap-8"}>
        {player.handSize > 0 && <HandPile player={player} />}
        <div
          className={cn("grid grid-flow-row gap-2")}
          style={{
            gridTemplateColumns: `repeat(${Math.min(player.inPlay.length + 1, MAX_COLUMNS)}, 1fr)`,
          }}>
          <OthersInPlays cards={cards} player={player} />
        </div>
      </div>
    </div>
  );
};
