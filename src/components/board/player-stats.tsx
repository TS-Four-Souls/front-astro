import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { useUserSettingsContext } from "./contexts/user-settings-context";
import { Gear } from "@/icons/gear";
import { Button } from "../button";

interface PlayerStatsProps {
  name: string;
  coins: number;
  health: number;
  attack: number;
  souls: number;
  isEngagedInCombat: boolean;
}

export const PlayerStats = ({
  name,
  coins,
  health,
  attack,
  souls,
  isEngagedInCombat,
}: PlayerStatsProps) => {
  const { state, issuer } = useGameContext();
  const { openMenu } = useUserSettingsContext();
  const { toast } = useToastContext();

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;
  const canEndTurn = isMe && state.me.capabilities?.endTurn;

  const onEndTurnPress = () => {
    console.log("Ending turn for", { name, issuer });
    socket.emit("endTurn", { issuer }, (response) => {
      switch (response.status) {
        case 200:
          break;
        default:
        case 400:
          toast("error", "Failed to end turn", response.error);
          break;
      }
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg p-4 text-white outline-3 outline-transparent transform-3d",
        isCurrentTurn && "outline-stone-700",
        isEngagedInCombat && "outline-red-500/60",
      )}>
      <div className="flex translate-z-1 items-center gap-2">
        <h1 className="font-bold">{name}</h1>
        {isMe && (
          <Gear className="size-4 cursor-pointer" onClick={() => openMenu()} />
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <li>Health: {health}</li>
        <li>Attack: {attack}</li>
        <li>Coins: {coins}</li>
        <li>Souls: {souls}</li>
      </ul>
      {isMe && (
        <Button
          onClick={onEndTurnPress}
          disabled={!canEndTurn}
          label="End Turn"
          className="translate-z-1"
        />
      )}
    </div>
  );
};
