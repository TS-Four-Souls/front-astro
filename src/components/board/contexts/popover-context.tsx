import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Popover } from "../popover";

interface Popover {
  anchor: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  withWrapper?: boolean;
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

  const closePopover = useCallback(() => {
    setPopover(null);
  }, []);

  const value = useMemo(
    () => ({ setPopover, closePopover }),
    [closePopover],
  );

  return (
    <PopoverContext.Provider value={value}>
      {children}
      {popover && (
        <Popover
          anchor={popover.anchor}
          className={popover.className}
          withWrapper={popover.withWrapper}>
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
  }, [closePopover]);

  return { setPopover, closePopover };
};
