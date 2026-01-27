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
  souls: number;
  isEngagedInCombat: boolean;
  isEngagedInPurchase: boolean;
  className?: string;
}

export const PlayerStats = ({
  name,
  coins,
  souls,
  isEngagedInCombat,
  isEngagedInPurchase,
  className,
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

  const onCoinPress = () => {
    if (state.me.coins === 0) {
      toast("error", "Cannot give coins", "You have no coins to give");
      return;
    }

    const promptId = `coin-prompt-${Date.now()}`;
    addPrompt<{ type: "number"; payload: number }>({
      promptId: `coin-prompt-${Date.now()}`,
      isUnique: false,
      prompt: "How many coins do you want to give?",
      options: Array.from({ length: state.me.coins }, (_, index) => ({
        type: "number",
        payload: index + 1,
      })),
      minCount: 1,
      maxCount: 1,
      onSubmit: function (selections): void {
        socket.emit(
          "giveCoins",
          { issuer, coins: selections[0].payload, target: name },
          (response) => {
            switch (response.status) {
              case 200:
                toast(
                  "success",
                  "Coins given",
                  `Gave ${selections[0].payload} coins to ${name}`,
                );
                removePrompt(promptId);
                break;
              default:
                toast("error", "Failed to give coins", response.error);
                break;
            }
          },
        );
      },
      onCancel: () => {
        removePrompt(promptId);
      },
    });
  };

  return (
    <div
      className={cn(
        "flex place-items-center gap-16 rounded-lg p-3 pr-4 pl-6 text-white outline-3 outline-transparent transform-3d",
        isCurrentTurn && "outline-stone-700",
        isEngagedInCombat && "outline-red-500/60",
        isEngagedInPurchase && "outline-yellow-400/87",
        className,
      )}>
      <h1 className="text-center font-alt-stats font-bold uppercase">{name}</h1>
      <div
        className="flex items-center gap-1"
        onClick={() => !isMe && onCoinPress()}>
        <img src="/coin.png" className="size-6 rounded-full shadow-md/50" />:
        <span className="font-statblock text-4xl">{coins}</span>
      </div>

      {souls > 0 && (
        <div className="flex flex-row-reverse items-center">
          {alternateSoulSequence(souls)
            .reverse()
            .map((type, index) => {
              return (
                <img
                  src={`/${type === 1 ? "soul-1" : "soul-2"}.png`}
                  className={cn(
                    type === 1 ? "h-6" : "h-8",
                    souls > 2 && "-ml-3",
                  )}
                  key={index}
                />
              );
            })}
        </div>
      )}

      {isMe && (
        <div className="flex items-center gap-4">
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
          <Gear className="size-5 cursor-pointer" onClick={() => openMenu()} />
        </div>
      )}
    </div>
  );
};

const alternateSoulSequence = (souls: number): (1 | 2)[] => {
  const sequence: (1 | 2)[] = [];
  const sequenceDividedByThree = Math.floor(souls / 3);

  for (let i = 0; i < sequenceDividedByThree; i++) {
    sequence.push(1, 2);
  }

  if (souls % 3 === 1) {
    sequence.push(1);
  } else if (souls % 3 === 2) {
    sequence.unshift(2);
  }

  return sequence;
};
