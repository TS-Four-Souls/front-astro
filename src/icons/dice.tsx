interface DiceProps {
  className?: string;
  style?: React.CSSProperties;
  value: number | undefined;
}

export const Dice = ({ className, style, value }: DiceProps) => {
  return (
    <img
      src={`/d6_${value ?? 0}.png`}
      width={24}
      height={24}
      className={className}
      style={style}
    />
  );
};
