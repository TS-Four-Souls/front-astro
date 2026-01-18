import { useRef } from "react";
import { cn } from "../../utils/cn";
import { Card, CardType } from "./card";
import seedrandom from "seedrandom";

interface PileProps {
  cards: { slug: string }[] | CardType[];
  size?: number;
  onClickTopCard?: () => void;
}

export const Pile = ({ cards, size: sizePx = 160, onClickTopCard }: PileProps) => {
  const size = sizePx / 16;
  const seed = useRef(Math.random().toString());
  const rng = seedrandom(seed.current);

  return (
    <div
      className="grid shrink-0 transform-3d"
      style={{ height: size + "rem" }}
    >
      {cards
        .filter((_, index) => index >= cards.length - 20)
        .map((card, index, array) => {
          const thickness = Math.max(0.05 * (cards.length / array.length), 0.1);
          return (
            <Card
              onClick={index === array.length - 1 ? onClickTopCard : undefined}
              thickness={thickness}
              key={index}
              card={card}
              className={cn(
                "col-start-1 row-start-1",
                cards.length === 1 && "shadow-lg/20",
                cards.length > 5 && index === 3 && "shadow-lg/20",
                cards.length > 10 && index === 2 && "shadow-xl/30",
                cards.length > 40 && index === 1 && "shadow-2xl/30",
                cards.length > 80 && index === 0 && "shadow-3xl/30",
              )}
              style={{
                transform: `
                  translateZ(${thickness * (index + 1)}rem)
                  rotate(${(rng() - 0.5) * 5}deg)
                `,
                height: size + "rem",
              }}
              top={index === array.length - 1}
            />
          );
        })}
      {cards.length === 0 && <Card style={{ height: size + "rem" }} />}
    </div>
  );
};
