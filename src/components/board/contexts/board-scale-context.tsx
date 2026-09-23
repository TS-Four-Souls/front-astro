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
import { useGameContext } from "./game-context";
import { usePopoverContext } from "./popover-context";
import {
  boardPointer,
  notifyBoardTransform,
  type BoardRect,
} from "../board-transform";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const PAN_THRESHOLD_PX = 8;
/** Zoom is treated as the autofit level inside this epsilon. */
const ZOOM_EPSILON = 0.001;

const BoardScaleContext = createContext(1);

export type BoardPoint = { x: number; y: number };

export type BoardView = {
  registerBoard: (el: HTMLDivElement | null) => void;
  registerViewport: (el: HTMLDivElement | null) => void;
  zoomed: boolean;
  resetView: () => void;
  toLocalRect: (rect: BoardRect) => BoardRect;
  toLocalPoint: (point: BoardPoint) => BoardPoint;
  getBaseScale: () => number;
};

const BoardViewContext = createContext<BoardView>({
  registerBoard: () => {},
  registerViewport: () => {},
  zoomed: false,
  resetView: () => {},
  toLocalRect: (rect) => rect,
  toLocalPoint: (point) => point,
  getBaseScale: () => 1,
});

type SafariGestureEvent = Event & {
  scale: number;
  clientX: number;
  clientY: number;
};

const isSafariGestureEvent = (event: Event): event is SafariGestureEvent =>
  "scale" in event && "clientX" in event && "clientY" in event;

const isResetControl = (target: EventTarget | null) =>
  target instanceof Element && target.closest("[data-reset-view]") !== null;

export const BoardScaleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { state, isSpectator } = useGameContext();
  const { closePopover } = usePopoverContext();
  const closePopoverRef = useRef(closePopover);
  closePopoverRef.current = closePopover;

  const boardRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const baseScaleRef = useRef(1);
  const zoomRef = useRef(1);
  const scaleRef = useRef(1);
  const translateRef = useRef({ x: 0, y: 0 });

  const [boardNode, setBoardNode] = useState<HTMLDivElement | null>(null);
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const [publishedScale, setPublishedScale] = useState(1);
  const [zoomed, setZoomed] = useState(false);

  const registerBoard = useCallback((el: HTMLDivElement | null) => {
    boardRef.current = el;
    setBoardNode(el);
  }, []);

  const registerViewport = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el;
    setViewportNode(el);
  }, []);

  const publishScale = useCallback(() => {
    const next = scaleRef.current;
    setPublishedScale((prev) => (Math.abs(prev - next) < 0.0001 ? prev : next));
  }, []);

  const syncZoomed = useCallback(() => {
    const next = zoomRef.current > MIN_ZOOM + ZOOM_EPSILON;
    setZoomed((prev) => (prev === next ? prev : next));
  }, []);

  const layoutCenter = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return { x: 0, y: 0 };
    const rect = viewport.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const clampTranslate = useCallback((x: number, y: number, scale: number) => {
    const board = boardRef.current;
    const viewport = viewportRef.current;
    if (!board || !viewport) return { x: 0, y: 0 };
    const maxX = Math.max(
      0,
      (board.offsetWidth * scale - viewport.clientWidth) / 2,
    );
    const maxY = Math.max(
      0,
      (board.offsetHeight * scale - viewport.clientHeight) / 2,
    );
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  const applyTransform = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const { x, y } = translateRef.current;
    board.style.transformOrigin = "center center";
    board.style.transform = `translate(${x}px, ${y}px) scale(${scaleRef.current})`;
    notifyBoardTransform();
  }, []);

  const applyZoomAtLocal = useCallback(
    (
      localX: number,
      localY: number,
      nextScale: number,
      focalX: number,
      focalY: number,
    ) => {
      const base = baseScaleRef.current;
      const clampedScale = Math.min(base * MAX_ZOOM, Math.max(base, nextScale));
      const origin = layoutCenter();
      const nextTranslate = clampTranslate(
        focalX - origin.x - localX * clampedScale,
        focalY - origin.y - localY * clampedScale,
        clampedScale,
      );
      scaleRef.current = clampedScale;
      zoomRef.current = base > 0 ? clampedScale / base : 1;
      translateRef.current = nextTranslate;
      applyTransform();
      syncZoomed();
    },
    [applyTransform, clampTranslate, layoutCenter, syncZoomed],
  );

  const zoomAtPoint = useCallback(
    (nextScale: number, focalX: number, focalY: number) => {
      const scale = scaleRef.current || 1;
      const origin = layoutCenter();
      const translate = translateRef.current;
      applyZoomAtLocal(
        (focalX - origin.x - translate.x) / scale,
        (focalY - origin.y - translate.y) / scale,
        nextScale,
        focalX,
        focalY,
      );
    },
    [applyZoomAtLocal, layoutCenter],
  );

  const autofit = useCallback(() => {
    const board = boardRef.current;
    const viewport = viewportRef.current;
    if (!board || !viewport) return;

    const boardWidth = board.offsetWidth;
    const boardHeight = board.offsetHeight;
    if (boardWidth === 0 || boardHeight === 0) return;

    const nextBase = Math.min(
      viewport.clientWidth / boardWidth,
      viewport.clientHeight / boardHeight,
    );
    if (!Number.isFinite(nextBase) || nextBase <= 0) return;

    baseScaleRef.current = nextBase;
    const background = board.querySelector<HTMLElement>(
      "[data-board-background]",
    );
    if (background) {
      background.style.width = `${viewport.clientWidth / nextBase}px`;
      background.style.height = `${viewport.clientHeight / nextBase}px`;
    }
    const nextScale = nextBase * zoomRef.current;
    scaleRef.current = nextScale;
    translateRef.current = clampTranslate(
      translateRef.current.x,
      translateRef.current.y,
      nextScale,
    );
    const boardEl = boardRef.current;
    if (boardEl) boardEl.style.transition = "none";
    applyTransform();
    publishScale();
    syncZoomed();
  }, [applyTransform, clampTranslate, publishScale, syncZoomed]);

  const resetView = useCallback(() => {
    closePopoverRef.current();
    const board = boardRef.current;
    if (board) board.style.transition = "transform 220ms ease-out";
    zoomRef.current = 1;
    scaleRef.current = baseScaleRef.current;
    translateRef.current = { x: 0, y: 0 };
    applyTransform();
    publishScale();
    syncZoomed();
  }, [applyTransform, publishScale, syncZoomed]);

  const toLocalRect = useCallback((rect: BoardRect): BoardRect => {
    const board = boardRef.current;
    const scale = scaleRef.current;
    if (!board || scale <= 0) return { ...rect };
    const visual = board.getBoundingClientRect();
    return {
      left: (rect.left - visual.left) / scale,
      top: (rect.top - visual.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
    };
  }, []);

  const toLocalPoint = useCallback(
    (point: BoardPoint): BoardPoint => {
      const rect = toLocalRect({
        left: point.x,
        top: point.y,
        width: 0,
        height: 0,
      });
      return { x: rect.left, y: rect.top };
    },
    [toLocalRect],
  );

  const getBaseScale = useCallback(() => baseScaleRef.current || 1, []);

  useEffect(() => {
    const preventWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };
    const preventGesture = (event: Event) => {
      event.preventDefault();
    };
    const trackPointer = (event: PointerEvent) => {
      boardPointer.x = event.clientX;
      boardPointer.y = event.clientY;
    };
    window.addEventListener("pointermove", trackPointer);
    window.addEventListener("wheel", preventWheelZoom, { passive: false });
    window.addEventListener("gesturestart", preventGesture, { passive: false });
    window.addEventListener("gesturechange", preventGesture, {
      passive: false,
    });
    window.addEventListener("gestureend", preventGesture, { passive: false });
    return () => {
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("wheel", preventWheelZoom);
      window.removeEventListener("gesturestart", preventGesture);
      window.removeEventListener("gesturechange", preventGesture);
      window.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportNode;
    if (!viewport) return;

    const pointers = new Map<number, BoardPoint>();
    let pinch: {
      startDist: number;
      startScale: number;
      localX: number;
      localY: number;
    } | null = null;
    let pan: {
      id: number;
      lastX: number;
      lastY: number;
      startX: number;
      startY: number;
      moved: boolean;
    } | null = null;
    let suppressClick = false;
    let suppressClicksUntil = 0;
    let wheelPublish = 0;
    let safariGesture: {
      overBoard: boolean;
      localX: number;
      localY: number;
      startScale: number;
    } | null = null;

    const rememberPointer = (x: number, y: number) => {
      boardPointer.x = x;
      boardPointer.y = y;
    };

    const clearTransition = () => {
      if (boardRef.current) boardRef.current.style.transition = "none";
    };

    const pointUnder = (x: number, y: number) => {
      const scale = scaleRef.current || 1;
      const origin = layoutCenter();
      const translate = translateRef.current;
      return {
        x: (x - origin.x - translate.x) / scale,
        y: (y - origin.y - translate.y) / scale,
      };
    };

    const endGesture = () => {
      if (pointers.size === 0 && pinch === null) publishScale();
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      rememberPointer(event.clientX, event.clientY);
      clearTransition();
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= viewport.clientHeight;
      const sensitivity = event.ctrlKey ? 0.012 : 0.0016;
      zoomAtPoint(
        scaleRef.current * Math.exp(-delta * sensitivity),
        event.clientX,
        event.clientY,
      );
      window.clearTimeout(wheelPublish);
      wheelPublish = window.setTimeout(() => publishScale(), 120);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isResetControl(event.target)) return;
      rememberPointer(event.clientX, event.clientY);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size >= 2) {
        pan = null;
        const pts = [...pointers.values()];
        const first = pts[0];
        const second = pts[1];
        if (!first || !second) return;
        const midX = (first.x + second.x) / 2;
        const midY = (first.y + second.y) / 2;
        const local = pointUnder(midX, midY);
        pinch = {
          startDist: Math.max(
            1,
            Math.hypot(first.x - second.x, first.y - second.y),
          ),
          startScale: scaleRef.current,
          localX: local.x,
          localY: local.y,
        };
        clearTransition();
        closePopoverRef.current();
        return;
      }

      pan = {
        id: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      rememberPointer(event.clientX, event.clientY);

      if (pinch && pointers.size >= 2) {
        const pts = [...pointers.values()];
        const first = pts[0];
        const second = pts[1];
        if (!first || !second) return;
        const dist = Math.max(
          1,
          Math.hypot(first.x - second.x, first.y - second.y),
        );
        applyZoomAtLocal(
          pinch.localX,
          pinch.localY,
          pinch.startScale * (dist / pinch.startDist),
          (first.x + second.x) / 2,
          (first.y + second.y) / 2,
        );
        return;
      }

      if (!pan || pan.id !== event.pointerId || pointers.size !== 1) return;
      const traveled = Math.hypot(
        event.clientX - pan.startX,
        event.clientY - pan.startY,
      );
      if (traveled < PAN_THRESHOLD_PX) {
        pan.lastX = event.clientX;
        pan.lastY = event.clientY;
        return;
      }
      if (zoomRef.current <= MIN_ZOOM + ZOOM_EPSILON) {
        pan.lastX = event.clientX;
        pan.lastY = event.clientY;
        return;
      }
      if (!pan.moved) {
        pan.moved = true;
        clearTransition();
        closePopoverRef.current();
      }
      const dx = event.clientX - pan.lastX;
      const dy = event.clientY - pan.lastY;
      pan.lastX = event.clientX;
      pan.lastY = event.clientY;
      translateRef.current = clampTranslate(
        translateRef.current.x + dx,
        translateRef.current.y + dy,
        scaleRef.current,
      );
      applyTransform();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      const wasPinch = pinch !== null;
      pointers.delete(event.pointerId);

      if (pan?.id === event.pointerId) {
        if (pan.moved) {
          suppressClick = true;
          window.setTimeout(() => {
            suppressClick = false;
          }, 0);
        }
        pan = null;
      }

      if (pointers.size < 2) pinch = null;

      if (wasPinch && pointers.size === 1) {
        const remaining = [...pointers.entries()][0];
        if (remaining) {
          const [id, point] = remaining;
          pan = {
            id,
            lastX: point.x,
            lastY: point.y,
            startX: point.x,
            startY: point.y,
            moved: true,
          };
        }
        suppressClick = true;
        suppressClicksUntil = performance.now() + 400;
      } else if (wasPinch) {
        suppressClick = true;
        suppressClicksUntil = performance.now() + 400;
      }

      endGesture();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick && performance.now() >= suppressClicksUntil) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    const onGestureStart = (event: Event) => {
      if (!isSafariGestureEvent(event)) return;
      event.preventDefault();
      rememberPointer(event.clientX, event.clientY);
      const overBoard =
        event.target instanceof Node && viewport.contains(event.target);
      const local = pointUnder(event.clientX, event.clientY);
      safariGesture = {
        overBoard,
        localX: local.x,
        localY: local.y,
        startScale: scaleRef.current,
      };
      if (overBoard) {
        clearTransition();
        closePopoverRef.current();
      }
    };

    const onGestureChange = (event: Event) => {
      if (!isSafariGestureEvent(event) || !safariGesture?.overBoard) return;
      event.preventDefault();
      rememberPointer(event.clientX, event.clientY);
      applyZoomAtLocal(
        safariGesture.localX,
        safariGesture.localY,
        safariGesture.startScale * event.scale,
        event.clientX,
        event.clientY,
      );
    };

    const onGestureEnd = (event: Event) => {
      event.preventDefault();
      safariGesture = null;
      publishScale();
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("click", onClickCapture, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("gesturestart", onGestureStart);
    window.addEventListener("gesturechange", onGestureChange);
    window.addEventListener("gestureend", onGestureEnd);

    return () => {
      window.clearTimeout(wheelPublish);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("gesturestart", onGestureStart);
      window.removeEventListener("gesturechange", onGestureChange);
      window.removeEventListener("gestureend", onGestureEnd);
    };
  }, [
    applyTransform,
    applyZoomAtLocal,
    clampTranslate,
    layoutCenter,
    publishScale,
    viewportNode,
    zoomAtPoint,
  ]);

  useLayoutEffect(() => {
    autofit();
  }, [state, isSpectator, boardNode, viewportNode, autofit]);

  useEffect(() => {
    window.addEventListener("resize", autofit);
    return () => window.removeEventListener("resize", autofit);
  }, [autofit]);

  const view = useMemo<BoardView>(
    () => ({
      registerBoard,
      registerViewport,
      zoomed,
      resetView,
      toLocalRect,
      toLocalPoint,
      getBaseScale,
    }),
    [
      getBaseScale,
      registerBoard,
      registerViewport,
      resetView,
      toLocalPoint,
      toLocalRect,
      zoomed,
    ],
  );

  return (
    <BoardScaleContext.Provider value={publishedScale}>
      <BoardViewContext.Provider value={view}>
        {children}
      </BoardViewContext.Provider>
    </BoardScaleContext.Provider>
  );
};

export const useBoardScale = () => useContext(BoardScaleContext);

export const useBoardView = () => useContext(BoardViewContext);
