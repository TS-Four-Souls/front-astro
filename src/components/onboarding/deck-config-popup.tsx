import type { DeckConfigCard } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useMemo, useState } from "react";
import { CardImage, CardType } from "../board/card";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { Popup } from "../popup";
import { t, ts, translateError } from "../../utils/translate";

export type DeckTypes =
  | "monster"
  | "treasure"
  | "loot"
  | "bsoul"
  | "room"
  | "character";

const deckTypeLabels: Record<DeckTypes, string> = {
  monster: t("startStep.gameParams.decks.monsters"),
  treasure: t("startStep.gameParams.decks.treasures"),
  character: t("startStep.gameParams.decks.characters"),
  loot: t("startStep.gameParams.decks.loots"),
  bsoul: t("startStep.gameParams.decks.bonusSouls"),
  room: t("startStep.gameParams.decks.rooms"),
};

interface DeckConfigPopupProps {
  type: DeckTypes;
  cards: DeckConfigCard[];
  onClose: () => void;
  editable: boolean;
}

export const DeckConfigPopup = ({
  type,
  cards,
  onClose,
  editable,
}: DeckConfigPopupProps) => {
  const { toast } = useToastContext();

  const canUseLookup = useMemo(() => {
    return cards.length > 10;
  }, [cards]);

  const [search, setSearch] = useState<string>("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      ts(card.nameKey).toLowerCase().includes(search.toLowerCase()),
    );
  }, [cards, search]);

  const onCardCountChange = (card: DeckConfigCard, count: number) => {
    socket.emit(
      "setGameParameter",
      {
        parameter: "decksConfig",
        value: {
          [type]: {
            ...card,
            count,
          },
        },
      },
      (response) => {
        if (response.status === 400)
          toast(
            "error",
            t("startStep.gameParams.inputs.cardCount.errorToast.title"),
            translateError(response.error),
          );
      },
    );
  };

  return (
    <Popup
      onPressBackdrop={onClose}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          {deckTypeLabels[type]}
        </h1>

        <div className="flex gap-2">
          {canUseLookup && (
            <input
              className="w-48 rounded-md border-2 border-taupe-500 px-4"
              placeholder={t("common.popup.search.placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <Button
            onClick={onClose}
            hotkey="escape"
            hotkeyScope={[HotkeyScope.Popup]}
            label={t("common.closeButton")}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex grow flex-wrap content-start justify-center gap-x-6 gap-y-12 overflow-auto p-4",
          filteredCards.some((card) => "eternal" in card) && "gap-x-16",
        )}>
        {filteredCards.map((card) => (
          <div className="flex flex-col items-center gap-4" key={card.slug}>
            <div
              className={cn(
                "flex flex-row items-center gap-2",
                card.count === 0 && "brightness-50 contrast-90",
              )}>
              <CardImage
                card={{ slug: card.slug }}
                sizes="12em"
                className="w-48 shadow-lg/30"
              />
              {"eternal" in card && (
                <>
                  {card.eternal === "random" ? (
                    <div className="grid items-center gap-2">
                      <CardImage
                        card={CardType.CharacterCard}
                        sizes="12em"
                        className="col-start-1 row-start-1 w-48 shadow-lg/30"
                      />
                      <p className="col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
                        ?
                      </p>
                    </div>
                  ) : (
                    <CardImage
                      card={{ slug: card.eternal }}
                      sizes="12em"
                      className="w-48 shadow-lg/30"
                    />
                  )}
                </>
              )}
            </div>
            <div className={cn("flex w-full", "eternal" in card && "w-1/2")}>
              <Button
                onClick={() => onCardCountChange(card, card.count - 1)}
                label={t("startStep.gameParams.inputs.numeric.decreaseButton")}
                className="rounded-r-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.title",
                  ),
                  content: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.message",
                  ),
                  enabled: !editable,
                }}
              />
              <p className="flex h-10 min-w-13 grow items-center justify-center border-y-2 border-taupe-600 text-center font-bold">
                {card.count}
              </p>
              <Button
                onClick={() => onCardCountChange(card, card.count + 1)}
                label={t("startStep.gameParams.inputs.numeric.increaseButton")}
                className="rounded-l-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.title",
                  ),
                  content: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.message",
                  ),
                  enabled: !editable,
                }}
              />
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="flex h-full w-full items-center justify-center text-center text-lg text-taupe-400">
            {t("startStep.gameParams.inputs.cardCount.emptyResults")}
          </div>
        )}
      </div>
    </Popup>
  );
};
