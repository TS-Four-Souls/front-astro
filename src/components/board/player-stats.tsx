import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { useUserSettingsContext } from "./contexts/user-settings-context";
import { Gear } from "@/icons/gear";
import { Button } from "../button";
import { usePromptContext } from "./contexts/prompt-context";

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
  const { addPrompt, removePrompt } = usePromptContext();

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;
  const canEndTurn = isMe && state.me.capabilities?.endTurn;

  const onEndTurnPress = () => {
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

  const onResetPress = (confirmed?: true) => {
    if (confirmed === undefined) {
      const promptId = `reset-confirm-${Date.now()}`;
      addPrompt({
        promptId,
        isUnique: true,
        prompt: "Are you sure you want to reset the game?",
        options: [
          { type: "boolean", payload: true },
          { type: "boolean", payload: false },
        ],
        minCount: 1,
        maxCount: 1,
        onSubmit: (selectedOptions) => {
          if (selectedOptions[0].payload === true) {
            onResetPress(true);
          }
          removePrompt(promptId);
        },
      });
      return;
    }
    socket.emit("reset", null, (response) => {
      switch (response.status) {
        case 200:
          toast("success", "Reset", "Game reset");
          break;
        default:
        case 400:
          toast("error", "Failed to reset", response.error);
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
        <>
          <Button
            onClick={() => onEndTurnPress()}
            disabled={!canEndTurn}
            label="End Turn"
            className="translate-z-1"
          />
          <Button
            onClick={() => onResetPress()}
            label="Reset"
            className="translate-z-1"
          />
        </>
      )}
    </div>
  );
};
