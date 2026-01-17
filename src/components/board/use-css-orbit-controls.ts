import { useEffect, useRef } from "react";

interface OrbitControlsProps {
  rotateSpeed: number;
  panSpeed: number;
  zoomSpeed: number;
}

export function useCssOrbitControls(
  parentRef: React.RefObject<HTMLDivElement | null>,
  boardRef: React.RefObject<HTMLDivElement | null>,
  { rotateSpeed, panSpeed, zoomSpeed }: OrbitControlsProps,
) {

  const initialState = {
    rotZ: 0,
    rotX: 0,
    x: 0,
    y: 0,
    mode: null as null | "pan" | "rotate",
    startPointerX: 0,
    startPointerY: 0,
    startRotZ: 0,
    startRotX: 0,
    startX: 0,
    startY: 0,
    isDragging: false,
    zoom: 100,
    autoFitZoom: 100,
  }

  const state = useRef({ ...initialState });

  useEffect(() => {
    autoFit();
  }, []);

  const update = () => {
    const board = boardRef.current;
    if (!board) return;

    const s = state.current;

    board.style.transformOrigin = `calc(50% - ${s.x}px) calc(50% - ${s.y}px)`;
    board.style.transform = `
      translate3d(${s.x}px, ${s.y}px, ${s.zoom - s.autoFitZoom}px)
      rotateX(${s.rotX}deg)
      rotateZ(${s.rotZ}deg)
    `;

    document.documentElement.style.fontSize = `${s.zoom}%`;
  };

  const autoFit = () => {
    const board = boardRef.current;
    if (!board) return;

    const s = state.current;

    const body = { width: document.body.clientWidth, height: document.body.clientHeight };
    const boardSize = { width: board.clientWidth, height: board.clientHeight };

    const scale = Math.min(body.width / boardSize.width, body.height / boardSize.height)

    s.rotZ = 0;
    s.rotX = 0;
    s.x = 0;
    s.y = 0;
    s.zoom = s.zoom * scale;
    s.autoFitZoom = s.zoom;

    update();
  }

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const board = boardRef.current;
    if (!board) return;

    const s = state.current;
    const DRAG_THRESHOLD = 5; // pixels

    const onPointerDown = (e: PointerEvent) => {
      // Determine interaction mode
      if (e.button === 0) s.mode = "pan"; // left button = pan
      if (e.button === 2) s.mode = "rotate"; // middle/right = orbit
      if (!s.mode) return;

      // Don't capture pointer yet - wait to see if it's a drag
      s.isDragging = false;
      s.startPointerX = e.clientX;
      s.startPointerY = e.clientY;
      s.startRotZ = s.rotZ;
      s.startRotX = s.rotX;
      s.startX = s.x;
      s.startY = s.y;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.mode) return;

      const dx = e.clientX - s.startPointerX;
      const dy = e.clientY - s.startPointerY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only start dragging if we've moved beyond the threshold
      if (!s.isDragging && distance > DRAG_THRESHOLD) {
        s.isDragging = true;
        parent.setPointerCapture(e.pointerId);
      }

      // Only update camera if we're actually dragging
      if (!s.isDragging) return;

      if (s.mode === "rotate") {
        s.rotX = s.startRotX - dy * rotateSpeed;
        s.rotX = Math.max(-60, Math.min(60, s.rotX)); // optional clamp
        s.rotZ = s.startRotZ - dx * rotateSpeed;
        s.rotZ = Math.max(-Infinity, Math.min(Infinity, s.rotZ));
      }

      if (s.mode === "pan") {
        const angle = (s.rotZ * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const worldDx = dx * cos + dy * sin;
        const worldDy = -dx * sin + dy * cos;

        s.x = s.startX + worldDx * panSpeed;
        s.y = s.startY + worldDy * panSpeed;
      }


      update();
    };

    const onPointerUp = (e: PointerEvent) => {
      s.mode = null;
      parent.releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      const currentZoom = s.zoom;
      const newZoom = Math.min(500, Math.max(100, s.zoom + -e.deltaY * zoomSpeed));
      const diff = newZoom / currentZoom;
      s.zoom = newZoom;

      s.x = s.x * diff;
      s.y = s.y * diff;
      update();
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        autoFit();
      }
    };

    parent.addEventListener("pointerdown", onPointerDown);
    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerup", onPointerUp);
    parent.addEventListener("wheel", onWheel, { passive: true });
    parent.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);

    update();

    return () => {
      parent.removeEventListener("pointerdown", onPointerDown);
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerup", onPointerUp);
      parent.removeEventListener("wheel", onWheel);
      parent.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [parentRef, boardRef, rotateSpeed, panSpeed, zoomSpeed]);
}
