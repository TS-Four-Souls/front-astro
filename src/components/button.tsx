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
        "rounded-md px-4 py-2 transition-[opacity,background-color] disabled:cursor-not-allowed disabled:opacity-30",
        onClick && "cursor-pointer",
        theme === "default" &&
          "bg-stone-600 text-white not-disabled:hover:bg-stone-500",
        theme === "onLight" &&
          "bg-stone-500 text-white not-disabled:hover:bg-stone-400",
        theme === "onDark" &&
          "bg-stone-800 text-white not-disabled:hover:bg-stone-700",
        active
          ? "bg-stone-300 text-stone-900 not-disabled:hover:bg-stone-300"
          : "",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      type={type}>
      {label}
    </button>
  );
};
