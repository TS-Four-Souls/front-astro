import { useEffect, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

export const REVEAL_MOVE_THRESHOLD_PX = 8;
const LONG_PRESS_MS = 500;
const CLICK_SWALLOW_MS = 400;
/** Compatibility mouse events after a pen or touch contact are not hover. */
const SYNTHETIC_MOUSE_MS = 1000;

type CancelPress = () => void;

type Press = {
  pointerId: number;
  opened: boolean;
  timer: number;
  stop: () => void;
};

const activePointerIds = new Set<number>();
const pendingPresses = new Set<CancelPress>();
let swallowNextClick = false;
let swallowTimer = 0;
let ignoreMouseHoverUntil = 0;

const noteContact = (event: PointerEvent) => {
  if (event.pointerType === "mouse") return;
  ignoreMouseHoverUntil = performance.now() + SYNTHETIC_MOUSE_MS;
};

export const isMouseHoverEvent = (event: { pointerType: string }) =>
  event.pointerType === "mouse" && performance.now() >= ignoreMouseHoverUntil;

const cancelPendingPresses = () => {
  for (const cancel of [...pendingPresses]) cancel();
};

const armClickSwallow = () => {
  swallowNextClick = true;
  window.clearTimeout(swallowTimer);
  swallowTimer = window.setTimeout(() => {
    swallowNextClick = false;
  }, CLICK_SWALLOW_MS);
};

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (event) => {
      noteContact(event);
      activePointerIds.add(event.pointerId);
      if (activePointerIds.size >= 2) cancelPendingPresses();
    },
    true,
  );
  const releasePointer = (event: PointerEvent) => {
    noteContact(event);
    activePointerIds.delete(event.pointerId);
  };
  window.addEventListener("pointerup", releasePointer, true);
  window.addEventListener("pointercancel", releasePointer, true);
  window.addEventListener(
    "click",
    (event) => {
      if (!swallowNextClick) return;
      swallowNextClick = false;
      window.clearTimeout(swallowTimer);
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
}

const isNestedRevealTarget = (event: ReactPointerEvent<Element>) => {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const reveal = target.closest("[data-reveal]");
  return reveal !== null && reveal !== event.currentTarget;
};

export type RevealProps = {
  "data-reveal": "";
  onPointerEnter: (event: ReactPointerEvent<Element>) => void;
  onPointerLeave: (event: ReactPointerEvent<Element>) => void;
  onPointerDown: (event: ReactPointerEvent<Element>) => void;
  onContextMenu: (event: ReactMouseEvent<Element>) => void;
};

export const useRevealGesture = (
  open: (element: Element) => void,
  close: () => void,
): RevealProps => {
  const openRef = useRef(open);
  const closeRef = useRef(close);
  openRef.current = open;
  closeRef.current = close;

  const bucket = useRef<{
    press: Press | null;
    cancel: CancelPress;
  } | null>(null);
  if (bucket.current === null) {
    const state: { press: Press | null; cancel: CancelPress } = {
      press: null,
      cancel: () => {},
    };
    state.cancel = () => {
      const press = state.press;
      if (!press) return;
      window.clearTimeout(press.timer);
      press.stop();
      state.press = null;
      pendingPresses.delete(state.cancel);
    };
    bucket.current = state;
  }

  useEffect(() => () => bucket.current?.cancel(), []);

  const onPointerEnter = (event: ReactPointerEvent<Element>) => {
    if (!isMouseHoverEvent(event)) return;
    openRef.current(event.currentTarget);
  };

  const onPointerLeave = (event: ReactPointerEvent<Element>) => {
    if (!isMouseHoverEvent(event)) return;
    if (!event.currentTarget.isConnected) return;
    closeRef.current();
  };

  const onPointerDown = (event: ReactPointerEvent<Element>) => {
    if (event.pointerType === "mouse" || event.button !== 0) return;
    if (isNestedRevealTarget(event)) return;
    if (activePointerIds.size >= 2) return;

    const state = bucket.current;
    if (!state) return;
    state.cancel();

    const element = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      if (state.press?.opened) return;
      const traveled = Math.hypot(
        moveEvent.clientX - startX,
        moveEvent.clientY - startY,
      );
      if (traveled >= REVEAL_MOVE_THRESHOLD_PX) state.cancel();
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      const opened = state.press?.opened ?? false;
      state.cancel();
      if (opened) armClickSwallow();
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const timer = window.setTimeout(() => {
      const press = state.press;
      if (!press) return;
      press.opened = true;
      pendingPresses.delete(state.cancel);
      if (element.isConnected) openRef.current(element);
    }, LONG_PRESS_MS);

    state.press = { pointerId, opened: false, timer, stop };
    pendingPresses.add(state.cancel);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onContextMenu = (event: ReactMouseEvent<Element>) => {
    const native = event.nativeEvent;
    const pointerType =
      "pointerType" in native && typeof native.pointerType === "string"
        ? native.pointerType
        : "";
    if (event.button === 2 || pointerType === "mouse") return;
    event.preventDefault();
  };

  return {
    "data-reveal": "",
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onContextMenu,
  };
};
