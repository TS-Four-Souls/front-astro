import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useGameContext } from "./game-context";

const BoardScaleContext = createContext(1);

export const BoardScaleProvider = ({
  boardRef,
  children,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) => {
  const { state, isSpectator } = useGameContext();
  const [scale, setScale] = useState(1);

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

    const nextScale = Math.min(
      available.width / boardSize.width,
      available.height / boardSize.height,
    );

    board.style.transform = `scale(${nextScale})`;
    setScale(nextScale);
  };

  useEffect(() => {
    window.addEventListener("resize", autofit);
    return () => {
      window.removeEventListener("resize", autofit);
    };
  }, []);

  useLayoutEffect(() => {
    autofit();
  }, [state, isSpectator, boardRef.current]);

  return (
    <BoardScaleContext.Provider value={scale}>
      {children}
    </BoardScaleContext.Provider>
  );
};

export const useBoardScale = () => useContext(BoardScaleContext);
