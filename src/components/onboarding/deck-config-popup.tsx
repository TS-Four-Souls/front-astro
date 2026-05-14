import { cn } from "@/utils/cn";
import { Popup } from "../popup";
import { CardImage } from "../board/card";
import type { DeckConfigCard } from "@/shared/api";
import { useMemo, useState } from "react";
import { socket } from "@/utils/socket";
import { Button } from "../button";

export type DeckTypes = "monster" | "treasure" | "loot" | "bsoul" | "room";

interface DeckConfigPopupProps {
  type: DeckTypes;
  cards: DeckConfigCard[];
  onPressBackdrop: () => void;
}

export const DeckConfigPopup = ({
  type,
  cards,
  onPressBackdrop,
}: DeckConfigPopupProps) => {
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
        switch (response.status) {
          case 200:
            break;
        }
      },
    );
  };

  return (
    <Popup
      onPressBackdrop={onPressBackdrop}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row justify-between gap-8">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          {type}
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
        </div>
      </div>

      <div className="flex grow flex-wrap place-content-center content-start gap-x-6 gap-y-12 overflow-auto p-4">
        {filteredCards.map((card) => (
          <div className="flex flex-col items-center gap-4" key={card.slug}>
            <CardImage
              card={{ slug: card.slug }}
              className={cn(
                "h-64 shadow-lg/30",
                card.count === 0 && "brightness-50 contrast-90",
              )}
            />
            <div className="flex w-full">
              <Button
                onClick={() => onCardCountChange(card, card.count - 1)}
                label="−"
                className="rounded-r-none font-sans shadow-none"
              />
              <p className="flex h-10 min-w-13 grow items-center justify-center border-y-2 border-taupe-600 text-center font-bold">
                {card.count}
              </p>
              <Button
                onClick={() => onCardCountChange(card, card.count + 1)}
                label="+"
                className="rounded-l-none font-sans shadow-none"
              />
            </div>
          </div>
        ))}
      </div>
    </Popup>
  );
};
