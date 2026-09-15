import { cn } from "@/utils/cn";
import { Button } from "./button";

interface SelectorProps<T> {
  ItemComponent: React.ComponentType<{ option: T; active: boolean }>;
  options: T[];
  value: T | undefined;
  onChange: (value: T) => void;
  onRemove: () => void;
}

export const Selector = <T,>({
  options,
  value,
  onChange,
  onRemove,
  ItemComponent,
}: SelectorProps<T>) => {
  return (
    <div className="flex flex-row items-center">
      {options.map((option, index) => (
        <Button
          key={index}
          className={cn(
            index > 0 && "rounded-l-none",
            index < options.length - 1 && "rounded-r-none",
          )}
          label={<ItemComponent option={option} active={value === option} />}
          onClick={value === option ? onRemove : () => onChange(option)}
          active={value === option}
        />
      ))}
    </div>
  );
};
