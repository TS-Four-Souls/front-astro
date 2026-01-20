import { cn } from "@/utils/cn";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  label?: string;
  type?: "button" | "submit" | "reset" | undefined;
  theme?: "default" | "onLight" | "onDark";
}

export const Button = ({
  onClick,
  disabled,
  active,
  label,
  className,
  theme = "default",
  type = undefined,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 text-white transition-colors",
        onClick &&
          (disabled
            ? "cursor-not-allowed brightness-80"
            : "cursor-pointer transition-[filter] hover:brightness-120"),
        theme === "default" && "bg-stone-600",
        theme === "onLight" && "bg-stone-500",
        theme === "onDark" && "bg-stone-800",
        active ? "bg-stone-300 text-stone-900" : "",
        className,
      )}
      onClick={onClick}
      type={type}>
      {label}
    </button>
  );
};
