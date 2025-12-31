import { useEffect } from "react";
import { Card } from "./card";
import type { GenericCardType } from "../types/api";

interface CursorCardProps {
  card: GenericCardType;
  face: "front" | "back";
}

export const CursorCard = ({ card, face }: CursorCardProps) => {
  useEffect(() => {
    const cursorCardElement = document.getElementById("cursor-card");
    if (!cursorCardElement) return;
    const onMouseMove = (e: MouseEvent) => {
      cursorCardElement.style.left = e.pageX + "px";
      cursorCardElement.style.top = e.pageY + "px";
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return <Card id="cursor-card" card={card} face={face} />;
};
