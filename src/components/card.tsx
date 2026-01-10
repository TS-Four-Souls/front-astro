import type { GenericCardType } from "../types/api";
import { BASE_URL } from "astro:env/client";

interface CursorCardProps {
  id?: string;
  style?: React.CSSProperties;
  card: GenericCardType;
  face: "front" | "back";
  cursor?: string;
  onClick?: () => void;
}

export const Card = ({
  id,
  style,
  card,
  face,
  cursor = card.charged  === false ? "default" : "pointer",
  onClick,
}: CursorCardProps) => {
  return (
    <img
      id={id}
      style={{ ...style, cursor }}
      src={`${BASE_URL}/images/${card.slug}/${face}`}
      alt={card.slug}
      data-charged={card.charged}
      onClick={onClick}
      draggable={false}
    />
  );
};
