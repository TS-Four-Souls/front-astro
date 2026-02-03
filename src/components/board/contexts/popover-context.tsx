import { createContext, useContext, useEffect, useState } from "react";
import { Popover } from "../popover";

interface Popover {
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  content: React.ReactNode;
  className?: string;
}

interface PopoverContextProps {
  setPopover: (popover: Popover) => void;
  closePopover: () => void;
}
export const PopoverContext = createContext<PopoverContextProps>({
  setPopover: () => {},
  closePopover: () => {},
});

export const PopoverProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [popover, setPopover] = useState<Popover | null>(null);

  const closePopover = () => {
    setPopover(null);
  };

  return (
    <PopoverContext.Provider value={{ setPopover, closePopover }}>
      {children}
      {popover && (
        <Popover anchor={popover.anchor} className={popover.className}>
          {popover.content}
        </Popover>
      )}
    </PopoverContext.Provider>
  );
};

export const usePopoverContext = () => {
  const { setPopover, closePopover } = useContext(PopoverContext);

  useEffect(() => {
    return closePopover;
  }, []);

  return { setPopover, closePopover };
};
