interface DiceProps {
  className?: string;
  style?: React.CSSProperties;
  value: number | undefined;
}

export const Dice = ({ className, style, value }: DiceProps) => {
  return (
    <img
      src={`/stack-icons/d6-${value ?? 0}.png`}
      width={24}
      height={24}
      className={className}
      style={style}
    />
  );
};
