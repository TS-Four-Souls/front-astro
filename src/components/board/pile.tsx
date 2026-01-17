import { cn } from "../../utils/cn";
import { Card, CardType } from "./card";

interface PileProps {
  cards: { slug: string }[] | CardType[];
  size?: number;
}

export const Pile = ({ cards, size: sizePx = 160 }: PileProps) => {
  const size = sizePx / 16;

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
              thickness={thickness}
              key={typeof card === "string" ? card : card.slug}
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
                  rotate(${(Math.random() - 0.5) * 5}deg)
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
