import { cn } from "@/utils/cn";
import { Card, CardType } from "./card";
import type { Tooltip } from "./use-tooltip";
import { Pile } from "./pile";
import type { TemporaryEffect } from "@/shared/api";

interface CardHoverPreviewProps {
  card: { slug: string } | CardType;
  stats?: {
    healthPoints: number;
    attackPoints: number;
    evasionPoints?: number;
  };
  effects?: TemporaryEffect[];
  counter?: number;
  tooltip?: Tooltip | Tooltip[];
  isEternal?: boolean;
}

const TooltipAboveCard = ({ tooltip }: { tooltip: Tooltip }) => {
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
        "relative w-full overflow-hidden rounded-2xl border-3 border-taupe-700 bg-taupe-950 p-3 px-4 text-center",
        type === "denied" && "border-red-950",
        type === "warning" && "border-yellow-900",
      )}>
      {title && <div className="mb-1 text-lg font-bold">{title}</div>}
      <div className="text-sm">{content}</div>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 touch-none",
          type === "denied" && "bg-red-600/10",
          type === "warning" && "bg-yellow-600/30",
        )}
      />
    </div>
  );
};

const normalizeTooltips = (
  tooltip: Tooltip | Tooltip[] | undefined,
): Tooltip[] => {
  if (tooltip === undefined) return [];
  return Array.isArray(tooltip) ? tooltip : [tooltip];
};

export const CardHoverPreview = ({
  card,
  stats,
  tooltip,
  effects,
  counter,
  isEternal,
}: CardHoverPreviewProps) => {
  const tooltips = normalizeTooltips(tooltip);
  const hasTooltips =
    tooltips.length > 0 &&
    tooltips.some((t) => ("enabled" in t ? t.enabled : t.capable !== true));

  return (
    <div className="flex w-min flex-col items-stretch gap-2.5">
      {isEternal && (
        <div className="rounded-md bg-taupe-200 p-2 text-center font-main text-sm text-black uppercase">
          -Eternal-
        </div>
      )}
      <div>
        {typeof card === "object" && "slug" in card && (
          <Card
            card={{ slug: card.slug }}
            stats={stats}
            effects={effects}
            counter={counter}
            size={22}
          />
        )}
      </div>
      {hasTooltips ? (
        <div className="flex flex-col gap-2">
          {tooltips.map((t, index) => (
            <TooltipAboveCard key={index} tooltip={t} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
