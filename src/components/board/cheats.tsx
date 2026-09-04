import type { Card, DetailedState, DiceRollJson } from "@/shared/api";
import { socket } from "@/utils/socket";
import { Button } from "../button";
import { useLanguageContext } from "../contexts/language-context";

export type CheatActions = {
  discard?: () => void;
  drawLoot?: () => void;
  selectLoot?: () => void;
  drawTreasure?: () => void;
  selectTreasure?: () => void;
  putInSlot?: () => void;
  putRoom?: () => void;
};

export interface CheatPromptServices {
  addPrompt: (prompt: any) => void;
  removePrompt: (promptId: string) => void;
  toast: (type: "error", title: string, message: string) => void;
  t: (...args: any[]) => string;
  translateError: (error: any) => string;
}

export const cheatDrawLoot = ({
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  socket.emit("debugLootTop", (response) => {
    if (response.status === 400) {
      toast(
        "error",
        t("gameStep.cheats.getLootTopDeck.errorToast.title"),
        translateError(response.error),
      );
    }
  });
};

export const cheatDrawTreasure = ({
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  socket.emit("debugGainTreasureTop", (response) => {
    if (response.status === 400) {
      toast(
        "error",
        t("gameStep.cheats.getTreasureTopDeck.errorToast.title"),
        translateError(response.error),
      );
    }
  });
};

export const discardCardCheat = (card: Card) => {
  socket.emit("debugRemoveCards", { cards: [card] }, (response) => {
    if (response.status !== 200)
      console.error("debugRemoveCards failed", response.error);
  });
};

export const gainCoinsCheat = ({
  addPrompt,
  removePrompt,
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  const promptId = `debug-gain-coins-${Date.now()}`;
  addPrompt({
    promptId,
    isUnique: false,
    prompt: t("gameStep.cheats.gainGoin.popup.title"),
    options: Array.from({ length: 10 }, (_, i) => ({
      type: "number",
      payload: i + 1,
    })),
    minCount: 1,
    maxCount: 1,
    onSubmit: (selections: Array<{ payload: number }>) => {
      socket.emit(
        "debugGainCoins",
        { coins: selections[0].payload },
        (response) => {
          if (response.status === 200) {
            removePrompt(promptId);
          } else {
            toast(
              "error",
              t("gameStep.cheats.gainGoin.popup.errorToast.title"),
              translateError(response.error),
            );
          }
        },
      );
    },
    onCancel: () => removePrompt(promptId),
  });
};

export const changeDiceValue = (
  dice: DiceRollJson,
  { addPrompt, removePrompt, toast, t, translateError }: CheatPromptServices,
) => {
  const promptId = `debug-dice-value-${Date.now()}`;
  addPrompt({
    promptId,
    isUnique: false,
    prompt: t("pending.changeDiceRoll"),
    options: [1, 2, 3, 4, 5, 6].map((value) => ({
      type: "number" as const,
      payload: value,
    })),
    minCount: 1,
    maxCount: 1,
    onSubmit: (selections: Array<{ payload: number }>) => {
      socket.emit(
        "debugChangeDiceResult",
        { dice, value: selections[0].payload },
        (response) => {
          if (response.status === 200) {
            removePrompt(promptId);
          } else {
            toast(
              "error",
              t("gameStep.cheats.changeDice.errorToast.title"),
              translateError(response.error),
            );
          }
        },
      );
    },
    onCancel: () => removePrompt(promptId),
  });
};

export const selectCardToLoot = ({
  addPrompt,
  removePrompt,
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  socket.emit("debugListLoot", (response) => {
    switch (response.status) {
      case 200: {
        const promptId = `debug-list-loot-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: t("gameStep.cheats.selectCardToLoot.popup.title"),
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 50,
          onSubmit: (selections: Array<{ payload: Card }>) => {
            socket.emit(
              "debugLoot",
              { cards: selections.map((selection) => selection.payload) },
              (response) => {
                if (response.status === 200) {
                  removePrompt(promptId);
                } else {
                  toast(
                    "error",
                    t(
                      "gameStep.cheats.selectCardToLoot.popup.errorToast.title",
                    ),
                    translateError(response.error),
                  );
                }
              },
            );
          },
          onCancel: () => removePrompt(promptId),
        });
        break;
      }
      case 400:
        toast(
          "error",
          t("gameStep.cheats.selectCardToLoot.errorToast.title"),
          translateError(response.error),
        );
        break;
    }
  });
};

export const selectCardToTreasure = ({
  addPrompt,
  removePrompt,
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  socket.emit("debugListTreasure", (response) => {
    switch (response.status) {
      case 200: {
        const promptId = `debug-list-treasure-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: t("gameStep.cheats.selectTreasureToLoot.popup.title"),
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 50,
          onSubmit: (selections: Array<{ payload: Card }>) => {
            socket.emit(
              "debugGainTreasure",
              { cards: selections.map((selection) => selection.payload) },
              (response) => {
                if (response.status === 200) {
                  removePrompt(promptId);
                } else {
                  toast(
                    "error",
                    t(
                      "gameStep.cheats.selectTreasureToLoot.popup.errorToast.title",
                    ),
                    translateError(response.error),
                  );
                }
              },
            );
          },
          onCancel: () => removePrompt(promptId),
        });
        break;
      }
      case 400:
        toast(
          "error",
          t("gameStep.cheats.selectTreasureToLoot.errorToast.title"),
          translateError(response.error),
        );
        break;
    }
  });
};

export const putMonsterInSlot = ({
  addPrompt,
  removePrompt,
  toast,
  t,
  translateError,
}: CheatPromptServices) => {
  socket.emit("debugListMonsterDeck", (response) => {
    switch (response.status) {
      case 200: {
        type MonsterCoverSelection =
          | { type: "deck"; payload: "monster" }
          | { type: "card"; payload: Card };
        const promptId = `debug-list-monster-deck-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: t("gameStep.cheats.putMonsterCardInSlot.popup.title"),
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 1,
          onSubmit: (selections: Array<{ payload: Card }>) => {
            const card = selections[0].payload;
            removePrompt(promptId);
            const promptId2 = `debug-list-monster-cover-${Date.now()}`;
            addPrompt({
              promptId: promptId2,
              isUnique: false,
              prompt: t("gameStep.attack.popup.title"),
              options: [
                { type: "deck" as const, payload: "monster" as const },
                ...response.coverable.map((card) => ({
                  type: "card" as const,
                  payload: card,
                })),
              ],
              minCount: 1,
              maxCount: 1,
              onSubmit: (selections: MonsterCoverSelection[]) => {
                const toCover =
                  selections[0].type === "deck" ? "top" : selections[0].payload;
                socket.emit(
                  "debugPutMonsterCardInSlot",
                  { card, toCover },
                  (response) => {
                    if (response.status === 200) {
                      removePrompt(promptId2);
                    } else {
                      toast(
                        "error",
                        t(
                          "gameStep.cheats.putMonsterCardInSlot.popup.errorToast.title",
                        ),
                        translateError(response.error),
                      );
                    }
                  },
                );
              },
              onCancel: () => removePrompt(promptId2),
            });
          },
          onCancel: () => removePrompt(promptId),
        });
        break;
      }
      case 400:
        toast(
          "error",
          t("gameStep.cheats.putMonsterCardInSlot.errorToast.title"),
          translateError(response.error),
        );
        break;
    }
  });
};

export const sendRequestPutRoomInSlot = (
  toCover: Card,
  card: Card,
  promptToRemove: string | null,
  { removePrompt, toast, t, translateError }: CheatPromptServices,
) => {
  socket.emit("debugPutRoom", { card, toCover }, (response) => {
    if (response.status === 200) {
      if (promptToRemove !== null) removePrompt(promptToRemove);
    } else {
      toast(
        "error",
        t("gameStep.cheats.putMonsterCardInSlot.popup.errorToast.title"),
        translateError(response.error),
      );
    }
  });
};

export const putRoomInSlot = (
  room: DetailedState["room"],
  services: CheatPromptServices,
) => {
  if (room === undefined) return;
  const { addPrompt, removePrompt, toast, t, translateError } = services;

  socket.emit("debugListRooms", (response) => {
    switch (response.status) {
      case 200: {
        const promptId = `debug-list-room-deck-${Date.now()}`;
        addPrompt({
          promptId,
          isUnique: false,
          prompt: t("gameStep.cheats.putMonsterCardInSlot.popup.title"),
          options: response.cards.map((card) => ({
            type: "card",
            payload: card,
          })),
          minCount: 1,
          maxCount: 1,
          onSubmit: (selections: Array<{ payload: Card }>) => {
            const card = selections[0].payload;
            removePrompt(promptId);
            if (room.inPlay.length !== 1) {
              const promptId2 = `debug-put-room-${Date.now()}`;
              addPrompt({
                promptId: promptId2,
                isUnique: false,
                prompt: t("gameStep.attack.popup.title"),
                options: room.inPlay.map((card) => ({
                  type: "card" as const,
                  payload: card,
                })),
                minCount: 1,
                maxCount: 1,
                onSubmit: (selections2: Array<{ payload: Card }>) =>
                  sendRequestPutRoomInSlot(
                    selections2[0].payload,
                    card,
                    promptId2,
                    services,
                  ),
                onCancel: () => removePrompt(promptId2),
              });
            } else {
              sendRequestPutRoomInSlot(room.inPlay[0], card, null, services);
            }
          },
          onCancel: () => removePrompt(promptId),
        });
        break;
      }
      case 400:
        toast(
          "error",
          t("gameStep.cheats.putMonsterCardInSlot.errorToast.title"),
          translateError(response.error),
        );
        break;
    }
  });
};

export const CheatButtons = (cheats: CheatActions) => {
  const { t } = useLanguageContext();
  const buttons = [
    ["drawLoot", cheats.drawLoot, t("gameStep.cheats.draw"), "top-12"],
    ["selectLoot", cheats.selectLoot, t("gameStep.cheats.select"), "bottom-12"],
    ["drawTreasure", cheats.drawTreasure, t("gameStep.cheats.draw"), "top-12"],
    [
      "selectTreasure",
      cheats.selectTreasure,
      t("gameStep.cheats.select"),
      "bottom-12",
    ],
    ["putInSlot", cheats.putInSlot, t("gameStep.cheats.putInSlot"), "top-12"],
    ["putRoom", cheats.putRoom, t("gameStep.cheats.putInSlot"), "top-12"],
  ] as const;

  return (
    <>
      {buttons.map(([option, onClick, label, position]) =>
        onClick ? (
          <Button
            key={option}
            onClick={onClick}
            className={`cheat-button absolute ${position} left-1/2 -translate-x-1/2 px-2 py-1 text-[10px]`}
            label={label}
          />
        ) : null,
      )}
      {cheats.discard && (
        <button
          type="button"
          className="cheat-button absolute top-1 right-1 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-sm leading-none font-bold text-white hover:brightness-110"
          onClick={(e) => {
            e.stopPropagation();
            cheats.discard?.();
          }}
          aria-label="Remove card">
          ×
        </button>
      )}
    </>
  );
};
