import { cn } from "@/utils/cn";
import { useGameContext } from "./useGameContext";
import { socket } from "@/utils/socket";

interface PlayerStatsProps {
  name: string;
  coins: number;
  health: number;
  attack: number;
  souls: number;
}

export const PlayerStats = ({ name, coins, health, attack, souls }: PlayerStatsProps) => {
  const { state, issuer } = useGameContext();

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;
  const canEndTurn = isMe && state.me.canEndTurn;

  const onEndTurnPress = () => {
    console.log("Ending turn for", { name, issuer });
    socket.emit("endTurn", { issuer }, (response) => {
      if (response.status === 200) {
        console.log("Turn ended");
      } else {
        console.error("Failed to end turn", response);
      }
    });
  };

  return (
    <div className={cn("text-white p-4 rounded-lg flex flex-col gap-2 border-3 border-transparent", isCurrentTurn && "border-stone-700")}>
      <h1 className="font-bold">{name}</h1>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs ">
        <li>Health: {health}</li>
        <li>Attack: {attack}</li>
        <li>Coins: {coins}</li>
        <li>Souls: {souls}</li>
      </ul>
      {isMe && <button disabled={!canEndTurn} onClick={onEndTurnPress} className={cn("w-full bg-stone-600 not-disabled:cursor-pointer text-white px-2 py-1 rounded-md not-disabled:hover:bg-stone-500 transition-colors", !canEndTurn && "opacity-20")}>End Turn</button>}
    </div>
  );
};