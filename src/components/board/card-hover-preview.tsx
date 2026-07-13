import { Card, CardType } from "./card";
import {
  normalizeTooltips,
  TooltipComponent,
  type Tooltip,
} from "./use-tooltip";
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
  orientation?: "portrait" | "landscape";
}

export const CardHoverPreview = ({
  card,
  stats,
  tooltip,
  effects,
  counter,
  isEternal,
  orientation = "portrait",
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
            size={orientation === "portrait" ? 22 : 16}
            orientation={orientation}
          />
        )}
      </div>
      {hasTooltips ? (
        <div className="flex flex-col gap-2">
          {tooltips.map((t, index) => (
            <TooltipComponent key={index} tooltip={t} />
          ))}
        </div>
      ) : null}
    </div>
  );
};
