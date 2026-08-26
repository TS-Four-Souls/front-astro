import { cn } from "@/utils/cn";

interface RoundCounterProps {
  className?: string;
  style?: React.CSSProperties;
  value: number;
}

export const RoundCounter = ({
  className,
  style,
  value,
}: RoundCounterProps) => {
  return (
    <div className="relative">
      <img
        src="d8.png"
        width={48}
        height={48}
        className={className}
        style={style}
      />
      <div className="absolute top-[14px] left-[12px] grid size-5 -rotate-7 place-content-center place-items-center font-alt-stats text-black">
        <span className={cn(value > 9 && "text-2xs")}>{value}</span>
      </div>
    </div>
  );
};
