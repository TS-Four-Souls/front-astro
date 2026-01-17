import { cn } from "@/utils/cn";

interface PlayerStatsProps {

  name: string;
  coins: number;
  health: number;
  attack: number;
  souls: number;
  isMe?: boolean;
  currentTurn: boolean;
  canEndTurn?: boolean;
}

export const PlayerStats = ({ name, coins, health, attack, souls, canEndTurn = false, isMe = false, currentTurn }: PlayerStatsProps) => {


  return (
    <div className={cn("text-white p-4 rounded-lg flex flex-col gap-2", currentTurn && "border-3 border-stone-700")}>
      <h1 className="font-bold">{name}</h1>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs ">
        <li>Health: {health}</li>
        <li>Attack: {attack}</li>
        <li>Coins: {coins}</li>
        <li>Souls: {souls}</li>
      </ul>
      {isMe && <button className="w-full bg-blue-800 cursor-pointer text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors">End Turn</button>}
    </div>
  );
};