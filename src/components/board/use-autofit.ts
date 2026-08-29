import { useEffect } from "react";
import { useGameContext } from "./contexts/game-context";

export const useAutofit = (
  boardRef: React.RefObject<HTMLDivElement | null>,
) => {
  const { state, isSpectator } = useGameContext();

  const autofit = () => {
    const board = boardRef.current;
    if (!board) return;

    // Use the parent viewport so spectator chrome insets are respected.
    const container = board.parentElement;
    const available = {
      width: container?.clientWidth ?? document.body.clientWidth,
      height: container?.clientHeight ?? document.body.clientHeight,
    };
    const boardSize = { width: board.clientWidth, height: board.clientHeight };

    const scale = Math.min(
      available.width / boardSize.width,
      available.height / boardSize.height,
    );

    board.style.transform = `scale(${scale})`;
  };

  useEffect(() => {
    window.addEventListener("resize", autofit);
    return () => {
      window.removeEventListener("resize", autofit);
    };
  }, []);

  useEffect(() => {
    autofit();
  }, [state, isSpectator, boardRef.current]);
};
