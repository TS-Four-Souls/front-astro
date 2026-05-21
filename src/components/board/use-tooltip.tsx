import { cn } from "@/utils/cn";
import { usePopoverContext } from "./contexts/popover-context";

type TooltipType = "denied" | "warning";

export type Tooltip =
  | {
      enabled: boolean;
      title?: string;
      content: string;
      type?: TooltipType;
    }
  | {
      capable: string | true;
      title?: string;
      type?: TooltipType;
    };

export const useTooltip = (props: Tooltip | undefined) => {
  const { setPopover, closePopover } = usePopoverContext();

  const setTooltip = (e: React.MouseEvent) => {
    if (!props) return;

    const enabled = "enabled" in props ? props.enabled : props.capable !== true;
    const title = props.title;
    const content =
      "enabled" in props
        ? props.content
        : props.capable === true
          ? undefined
          : props.capable;
    const type = props.type ?? ("capable" in props ? "denied" : undefined);

    if (!enabled) return;

    setPopover({
      anchor: e.currentTarget.getBoundingClientRect(),
      className: cn(
        "px-4 overflow-hidden relative text-center",
        type === "denied" && "border-red-950",
        type === "warning" && "border-yellow-900",
      ),
      content: (
        <>
          {title && <div className="mb-1 text-lg font-bold">{title}</div>}
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {content}
          </div>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 touch-none",
              type === "denied" && "bg-red-600/10",
              type === "warning" && "bg-yellow-600/30",
            )}
          />
        </>
      ),
    });
  };

  return { setTooltip, closeTooltip: closePopover };
};
