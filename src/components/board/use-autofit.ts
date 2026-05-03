import { useEffect } from "react";
import { useGameContext } from "./contexts/game-context";

export const useAutofit = (
  boardRef: React.RefObject<HTMLDivElement | null>,
) => {
  const { state } = useGameContext();

  const autofit = () => {
    const board = boardRef.current;
    if (!board) return;

    const body = {
      width: document.body.clientWidth,
      height: document.body.clientHeight,
    };
    const boardSize = { width: board.clientWidth, height: board.clientHeight };

    const scale = Math.min(
      body.width / boardSize.width,
      body.height / boardSize.height,
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
  }, [state, boardRef.current]);
};
