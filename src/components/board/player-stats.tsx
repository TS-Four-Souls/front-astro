import { cn } from "@/utils/cn";
import { useGameContext } from "./contexts/game-context";
import { socket } from "@/utils/socket";
import { useToastContext } from "./contexts/toast-context";
import { useUserSettingsContext } from "./contexts/user-settings-context";
import { Gear } from "@/icons/gear";
import { Button } from "../button";
import { usePromptContext } from "./contexts/prompt-context";
import { tooltip } from "@/utils/tooltip";

interface PlayerStatsProps {
  name: string;
  coins: number;
  health: number;
  attack: number;
  souls: number;
  isEngagedInCombat: boolean;
  isEngagedInPurchase: boolean;
}

export const PlayerStats = ({
  name,
  coins,
  health,
  attack,
  souls,
  isEngagedInCombat,
  isEngagedInPurchase,
}: PlayerStatsProps) => {
  const { state, issuer } = useGameContext();
  const { openMenu } = useUserSettingsContext();
  const { toast, block } = useToastContext();
  const { addPrompt, removePrompt } = usePromptContext();

  const isCurrentTurn = state.turn === name;
  const isMe = state.me.name === name;
  const canEndTurn = isMe && state.me.capabilities.endTurn;

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
        onCancel: () => {
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
        "flex flex-col gap-5 rounded-lg p-4 text-white outline-3 outline-transparent transform-3d",
        isCurrentTurn && "outline-stone-700",
        isEngagedInCombat && "outline-red-500/60",
        isEngagedInPurchase && "outline-yellow-400/87",
      )}>
      <div className="flex translate-z-1 place-content-center place-items-center gap-2">
        <h1 className="text-center font-alt-stats font-bold uppercase">
          {name}
        </h1>
        {isMe && (
          <Gear className="size-5 cursor-pointer" onClick={() => openMenu()} />
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs">
        <li className="flex items-center gap-1">
          {Array.from({ length: health }).map((_, index) => (
            <img src="/heart.png" className="size-6" key={index} />
          ))}
        </li>
        <li className="flex items-center gap-1">
          {Array.from({ length: attack }).map((_, index) => (
            <img src="/sword.png" className="size-6" key={index} />
          ))}
        </li>
        <li className="flex items-center gap-2">
          {coins} × <img src="/coin.png" className="size-6" />
        </li>
        <li className="flex items-center gap-0">
          {souls} × <img src="/soul.png" className="size-8" />
        </li>
      </ul>
      {isMe && (
        <div className="flex flex-col gap-1">
          <Button
            disabled={canEndTurn !== true}
            onClick={() =>
              block(
                "Cannot end turn",
                state.me.capabilities.endTurn,
                onEndTurnPress,
              )
            }
            tooltip={tooltip("Cannot end turn", state.me.capabilities.endTurn)}
            label="End turn"
            className="translate-z-1"
          />
          <Button
            onClick={() => onResetPress()}
            label="Reset"
            className="translate-z-1"
          />
        </div>
      )}
    </div>
  );
};
