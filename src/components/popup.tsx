interface PopupProps {
  children: React.ReactNode;
  onPressBackdrop?: () => void;
}

export const Popup = ({ children, onPressBackdrop }: PopupProps) => {
  return (
    <div
      className="fixed top-0 left-0 flex h-full w-full place-content-center place-items-center bg-black/50"
      onClick={onPressBackdrop}>
      <div
        className="flex min-h-80 min-w-120 flex-col gap-4 rounded-lg bg-stone-700 p-4"
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
