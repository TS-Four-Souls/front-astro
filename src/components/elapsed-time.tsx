import { cn } from "@/utils/cn";
import { useEffect, useState } from "react";

const formatElapsed = (since: Date | string): string => {
  const start =
    since instanceof Date ? since.getTime() : new Date(since).getTime();
  if (Number.isNaN(start)) return "0:00";

  const totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(hours > 0 ? 2 : 1, "0");
  const ss = seconds.toString().padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

interface ElapsedTimeProps {
  since: Date | string;
  className?: string;
}

export const ElapsedTime = ({ since, className }: ElapsedTimeProps) => {
  const [label, setLabel] = useState(() => formatElapsed(since));

  useEffect(() => {
    const tick = () => setLabel(formatElapsed(since));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [since]);

  return <span className={cn("tabular-nums", className)}>{label}</span>;
};
