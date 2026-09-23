export type BoardRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Latest pointer, so tooltips can tell when a pan moved the anchor off the cursor. */
export const boardPointer = { x: -1, y: -1 };

const listeners = new Set<() => void>();

export const subscribeBoardTransform = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyBoardTransform = () => {
  listeners.forEach((listener) => listener());
};

export const rectContainsPoint = (
  rect: BoardRect,
  x: number,
  y: number,
): boolean =>
  x >= rect.left &&
  x <= rect.left + rect.width &&
  y >= rect.top &&
  y <= rect.top + rect.height;
