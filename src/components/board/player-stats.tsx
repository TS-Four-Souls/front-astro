import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { useUserSettingsContext } from "./contexts/user-settings-context";
import { Gear } from "@/icons/gear";

interface PlayerStatsProps {
  name: string;
  coins: number;
  health: number;
  attack: number;
  souls: number;
}

export const PlayerStats = ({
  name,
  coins,
  health,
  attack,
  souls,
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
        "flex flex-col gap-2 rounded-lg border-3 border-transparent p-4 text-white transform-3d",
        isCurrentTurn && "border-stone-700",
      )}>
      <div className="flex items-center gap-2">
        <h1 className="font-bold">{name}</h1>
        {isMe && <Gear className="size-4 cursor-pointer" onClick={() => openMenu()} />}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <li>Health: {health}</li>
        <li>Attack: {attack}</li>
        <li>Coins: {coins}</li>
        <li>Souls: {souls}</li>
      </ul>
      {isMe && (
        <button
          disabled={!canEndTurn}
          onClick={onEndTurnPress}
          className={cn(
            "w-full cursor-pointer rounded-md bg-stone-600 px-2 py-1 text-white transition-colors not-disabled:hover:bg-stone-500 disabled:cursor-not-allowed disabled:opacity-50 translate-z-2",
          )}>
          End Turn
        </button>
      )}
    </div>
  );
};
