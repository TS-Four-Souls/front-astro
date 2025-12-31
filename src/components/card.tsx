import type { GenericCardType } from "../types/api";

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
      src={`http://localhost:3000/images/${card.slug}/${face}`}
      alt={card.slug}
      data-charged={card.charged}
      onClick={onClick}
      draggable={false}
    />
  );
};
