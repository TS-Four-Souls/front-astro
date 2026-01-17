interface PlayerStatsProps {
    name: string;
    coins: number;
    health: number;
    attack: number;
    souls: number;
}

export const PlayerStats = ({ name, coins, health, attack, souls }: PlayerStatsProps) => {
  return (
    <div className="text-white">
      <h1>{name}</h1>
      <ul>
        <li>Health: {health}</li>
        <li>Attack: {attack}</li>
        <li>Coins: {coins}</li>
        <li>Souls: {souls}</li>
      </ul>
    </div>
  );
};