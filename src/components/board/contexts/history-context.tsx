import { createContext, useContext, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface HistoryContextProps {
  isOpen: boolean;
  toggleHistory: () => void;
  openHistory: () => void;
  closeHistory: () => void;
}

export const HistoryContext = createContext<HistoryContextProps>({
  isOpen: true,
  toggleHistory: () => {},
  openHistory: () => {},
  closeHistory: () => {},
});

export const HistoryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleHistory = () => setIsOpen((prev) => !prev);
  const openHistory = () => setIsOpen(true);
  const closeHistory = () => setIsOpen(false);

  useHotkeys("h", toggleHistory, { enabled: true });

  return (
    <HistoryContext.Provider
      value={{ isOpen, toggleHistory, openHistory, closeHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistoryContext = () => {
  return useContext(HistoryContext);
};
