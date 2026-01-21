import { cn } from "@/utils/cn";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  label?: string;
  type?: "button" | "submit" | "reset" | undefined;
  theme?: "default" | "onLight" | "onDark";
  tooltip?: string;
}

export const Button = ({
  onClick,
  disabled,
  active,
  label,
  className,
  theme = "default",
  type = undefined,
  tooltip,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 font-main text-white uppercase shadow-2xl shadow-stone-950/10 transition-colors",
        onClick &&
          (disabled
            ? "cursor-not-allowed brightness-40 contrast-60"
            : "cursor-pointer transition-[filter] hover:brightness-120"),
        theme === "default" && "bg-stone-600",
        theme === "onLight" && "bg-stone-500",
        theme === "onDark" && "bg-stone-800",
        active ? "bg-stone-300 text-stone-900" : "",
        className,
      )}
      onClick={onClick}
      type={type}
      title={tooltip}>
      {label}
    </button>
  );
};
