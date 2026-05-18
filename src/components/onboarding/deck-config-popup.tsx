import { cn } from "@/utils/cn";
import { Popup } from "../popup";
import { CardImage, CardType } from "../board/card";
import type { DeckConfigCard } from "@/shared/api";
import { useMemo, useState } from "react";
import { socket } from "@/utils/socket";
import { Button } from "../button";
import { HotkeyScope } from "@/utils/hotkey";
import { useToastContext } from "../board/contexts/toast-context";

export type DeckTypes =
  | "monster"
  | "treasure"
  | "loot"
  | "bsoul"
  | "room"
  | "character";

const deckTypeLabels: Record<DeckTypes, string> = {
  monster: "Monster Cards",
  treasure: "Treasure Cards",
  character: "Character Cards",
  loot: "Loot Cards",
  bsoul: "Bonus Souls",
  room: "Room Cards",
};

interface DeckConfigPopupProps {
  type: DeckTypes;
  cards: DeckConfigCard[];
  onPressBackdrop: () => void;
  editable: boolean;
}

export const DeckConfigPopup = ({
  type,
  cards,
  onPressBackdrop,
  editable,
}: DeckConfigPopupProps) => {
  const { toast } = useToastContext();

  const canUseLookup = useMemo(() => {
    return cards.length > 10;
  }, [cards]);

  const [search, setSearch] = useState<string>("");

  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      card.name.toLowerCase().includes(search.toLowerCase()),
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
          toast("error", "Failed to change card count", response.error);
      },
    );
  };

  return (
    <Popup
      onPressBackdrop={onPressBackdrop}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          {deckTypeLabels[type]}
        </h1>

        <div className="flex gap-2">
          {canUseLookup && (
            <input
              className="w-48 rounded-md border-2 border-taupe-500 px-4"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          <Button
            onClick={onPressBackdrop}
            hotkey="escape"
            hotkeyScope={[HotkeyScope.Popup]}
            label="Close"
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
                className="h-64 shadow-lg/30"
              />
              {"eternal" in card && (
                <>
                  {card.eternal === "random" ? (
                    <div className="grid items-center gap-2">
                      <CardImage
                        card={CardType.CharacterCard}
                        className="col-start-1 row-start-1 h-64 shadow-lg/30"
                      />
                      <p className="col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
                        ?
                      </p>
                    </div>
                  ) : (
                    <CardImage
                      card={{ slug: card.eternal }}
                      className="h-64 shadow-lg/30"
                    />
                  )}
                </>
              )}
            </div>
            <div className={cn("flex w-full", "eternal" in card && "w-1/2")}>
              <Button
                onClick={() => onCardCountChange(card, card.count - 1)}
                label="−"
                className="rounded-r-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: "Cannot change card count",
                  capable: editable
                    ? true
                    : "Only the host can change card count",
                }}
              />
              <p className="flex h-10 min-w-13 grow items-center justify-center border-y-2 border-taupe-600 text-center font-bold">
                {card.count}
              </p>
              <Button
                onClick={() => onCardCountChange(card, card.count + 1)}
                label="+"
                className="rounded-l-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: "Cannot change card count",
                  capable: editable
                    ? true
                    : "Only the host can change card count",
                }}
              />
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="flex h-full w-full items-center justify-center text-center text-lg text-taupe-400">
            No cards to display
          </div>
        )}
      </div>
    </Popup>
  );
};
