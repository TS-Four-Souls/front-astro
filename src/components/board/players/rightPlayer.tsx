import type { Player } from "@/shared/api";
import { PlayerStats } from "../player-stats";
import { cn } from "@/utils/cn";
import { HandPile } from "../hand-pile";
import { OthersInPlays } from "./othersInPlays";

interface RightPlayerProps {
  player: Player;
}

const MAX_ROWS = 3;

export const RightPlayer = ({ player }: RightPlayerProps) => (
  <div
    key={player.name}
    className={
      "col-start-3 row-span-3 flex flex-col place-content-center place-items-start gap-8"
    }>
    <div
      className={cn(
        "flex flex-col place-content-center place-items-center gap-8",
        player.inPlay.length + 1 > MAX_ROWS && "flex-row",
      )}>
      <PlayerStats player={player} className={"flex-col gap-4 px-6 py-4"} />
      {player.handSize > 0 && <HandPile player={player} />}
    </div>
    <div
      className={cn(
        "flex flex-col place-content-center place-items-center gap-8",
      )}>
      <div
        className={cn("grid gap-2", "grid-flow-col")}
        style={{
          gridTemplateRows: `repeat(${Math.min(player.inPlay.length + 1, MAX_ROWS)}, 1fr)`,
        }}>
        <OthersInPlays
          cards={[player.character, ...player.inPlay]}
          player={player}
        />
      </div>
    </div>
  </div>
);
