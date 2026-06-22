import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";

type TooltipType = "denied" | "warning" | "gold";

export type Tooltip =
  | {
      enabled: boolean;
      title?: string;
      content?: string;
      type?: TooltipType;
    }
  | {
      capable: string | true;
      title?: string;
      type?: TooltipType;
    };

export const normalizeTooltips = (
  tooltip: Tooltip | Tooltip[] | undefined,
): Tooltip[] => {
  if (tooltip === undefined) return [];
  return Array.isArray(tooltip) ? tooltip : [tooltip];
};

export const useTooltip = (tooltip: Tooltip | Tooltip[] | undefined) => {
  const { setPopover, closePopover } = usePopoverContext();
  const tooltips = normalizeTooltips(tooltip);

  const hasTooltips =
    tooltips.length > 0 &&
    tooltips.some((t) => ("enabled" in t ? t.enabled : t.capable !== true));

  const setTooltip = (e: React.MouseEvent) => {
    if (!hasTooltips) return;

    setPopover({
      anchor: e.currentTarget.getBoundingClientRect(),
      withWrapper: false,
      content: (
        <div className="flex flex-col gap-1">
          {tooltips.map((t, index) => (
            <TooltipComponent key={index} tooltip={t} />
          ))}
        </div>
      ),
    });
  };

  return { setTooltip, closeTooltip: closePopover };
};

export const TooltipComponent = ({ tooltip }: { tooltip: Tooltip }) => {
  const enabled =
    "enabled" in tooltip ? tooltip.enabled : tooltip.capable !== true;
  if (!enabled) return null;

  const title = tooltip.title;
  const content =
    "enabled" in tooltip
      ? tooltip.content
      : tooltip.capable === true
        ? undefined
        : tooltip.capable;
  const type = tooltip.type ?? ("capable" in tooltip ? "denied" : undefined);

  return (
    <div
      className={cn(
        "relative w-full gap-1 overflow-hidden rounded-2xl border-3 border-taupe-700 bg-taupe-950 p-3 px-4 text-center",
        type === "denied" && "border-red-950",
        type === "warning" && "border-yellow-900",
        type === "gold" && "border-yellow-600",
      )}>
      {title && (
        <div
          className={cn(
            "text-lg font-bold",
            type === "gold" && "text-yellow-500",
          )}>
          {title}
        </div>
      )}
      {content && <div className="text-sm">{content}</div>}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 touch-none",
          type === "denied" && "bg-red-600/10",
          type === "warning" && "bg-yellow-600/30",
          type === "gold" && "bg-yellow-600/20",
        )}
      />
    </div>
  );
};
