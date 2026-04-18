import { cn } from "@/utils/cn";

interface SelectionIndexIndicatorProps {
  index: number;
  className?: string;
}

export const SelectionIndexIndicator = ({
  index,
  className,
}: SelectionIndexIndicatorProps) => {
  return (
    <div
      className={cn(
        "absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-blue-100 text-xl font-black text-blue-900 outline-4 outline-blue-500",
        className,
      )}>
      {index}
    </div>
  );
};
