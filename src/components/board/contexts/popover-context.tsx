import { createContext, useContext, useState } from "react";
import { Popover } from "../popover";

interface Popover {
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  content: React.ReactNode;
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
      {popover && <Popover anchor={popover.anchor}>{popover.content}</Popover>}
    </PopoverContext.Provider>
  );
};

export const usePopoverContext = () => {
  return useContext(PopoverContext);
};
