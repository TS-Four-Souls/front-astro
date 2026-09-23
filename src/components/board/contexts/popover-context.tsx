import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Popover } from "../popover";
import {
  boardPointer,
  rectContainsPoint,
  subscribeBoardTransform,
} from "../board-transform";

interface Popover {
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  /** Live element. Remeasured when the board zooms or pans. */
  anchorElement?: Element;
  withWrapper?: boolean;
  content: React.ReactNode;
  className?: string;
}

interface PopoverContextProps {
  setPopover: (popover: Popover) => void;
  closePopover: () => void;
}
export const PopoverContext = createContext<PopoverContextProps>({
  setPopover: () => {},
  closePopover: () => {},
});

export const PopoverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [popover, setPopover] = useState<Popover | null>(null);

  const closePopover = useCallback(() => {
    setPopover(null);
  }, []);

  useLayoutEffect(
    () =>
      subscribeBoardTransform(() => {
        setPopover((current) => {
          const anchorElement = current?.anchorElement;
          if (!current || !anchorElement) return current;
          if (!anchorElement.isConnected) return null;
          const rect = anchorElement.getBoundingClientRect();
          const { x, y } = boardPointer;
          if (x >= 0 && y >= 0 && !rectContainsPoint(rect, x, y)) return null;
          if (
            current.anchor.left === rect.left &&
            current.anchor.top === rect.top &&
            current.anchor.width === rect.width &&
            current.anchor.height === rect.height
          ) {
            return current;
          }
          return {
            ...current,
            anchor: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
          };
        });
      }),
    [],
  );

  const value = useMemo(() => ({ setPopover, closePopover }), [closePopover]);

  return (
    <PopoverContext.Provider value={value}>
      {children}
      {popover && (
        <Popover
          anchor={popover.anchor}
          className={popover.className}
          withWrapper={popover.withWrapper}>
          {popover.content}
        </Popover>
      )}
    </PopoverContext.Provider>
  );
};

export const usePopoverContext = () => {
  return useContext(PopoverContext);
};
