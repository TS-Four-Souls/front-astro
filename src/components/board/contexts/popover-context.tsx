import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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

const anchorClearedListeners = new Set<(anchor: Element) => void>();

/** Fired when a popover anchor is closed or replaced, so owners can drop it. */
export const subscribePopoverAnchorCleared = (
  listener: (anchor: Element) => void,
) => {
  anchorClearedListeners.add(listener);
  return () => {
    anchorClearedListeners.delete(listener);
  };
};

const emitPopoverAnchorCleared = (anchor: Element) => {
  anchorClearedListeners.forEach((listener) => listener(anchor));
};

export const PopoverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [popover, setPopoverState] = useState<Popover | null>(null);
  const popoverRef = useRef<Popover | null>(null);

  const commitPopover = useCallback((next: Popover | null) => {
    const previousAnchor = popoverRef.current?.anchorElement;
    const nextAnchor = next?.anchorElement;
    popoverRef.current = next;
    setPopoverState(next);
    if (previousAnchor && previousAnchor !== nextAnchor) {
      emitPopoverAnchorCleared(previousAnchor);
    }
  }, []);

  const setPopover = useCallback(
    (next: Popover) => {
      commitPopover(next);
    },
    [commitPopover],
  );

  const closePopover = useCallback(() => {
    commitPopover(null);
  }, [commitPopover]);

  useLayoutEffect(
    () =>
      subscribeBoardTransform(() => {
        const current = popoverRef.current;
        const anchorElement = current?.anchorElement;
        if (!current || !anchorElement) return;
        if (!anchorElement.isConnected) {
          commitPopover(null);
          return;
        }
        const rect = anchorElement.getBoundingClientRect();
        const { x, y } = boardPointer;
        if (x >= 0 && y >= 0 && !rectContainsPoint(rect, x, y)) {
          commitPopover(null);
          return;
        }
        if (
          current.anchor.left === rect.left &&
          current.anchor.top === rect.top &&
          current.anchor.width === rect.width &&
          current.anchor.height === rect.height
        ) {
          return;
        }
        commitPopover({
          ...current,
          anchor: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        });
      }),
    [commitPopover],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      const anchor = popoverRef.current?.anchorElement;
      if (!anchor) return;
      if (event.target instanceof Node && anchor.contains(event.target)) return;
      commitPopover(null);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [commitPopover]);

  const value = useMemo(
    () => ({ setPopover, closePopover }),
    [setPopover, closePopover],
  );

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
