interface PopoverProps {
  children: React.ReactNode;
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export const Popover = ({ children, anchor }: PopoverProps) => {
  return (
    <div
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-full"
      style={{
        top: anchor.top - 10 + "px",
        left: anchor.left + anchor.width / 2 + "px",
      }}>
      <div className="rounded-3xl border-3 border-stone-700 bg-stone-950 p-3">
        {children}
      </div>
    </div>
  );
};
