import { Popup } from "@/components/popup";
import { createContext, useContext, useState } from "react";
import { MainMenu } from "../main-menu";

interface MainMenuContextProps {
  openMenu: () => void;
  closeMenu: () => void;
}

export const MainMenuContext = createContext<MainMenuContextProps>({
  openMenu: () => {},
  closeMenu: () => {},
});

export const MainMenuProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MainMenuContext.Provider
      value={{
        openMenu: () => setIsOpen(true),
        closeMenu: () => setIsOpen(false),
      }}>
      {children}
      {isOpen && (
        <Popup onPressBackdrop={() => setIsOpen(false)}>
          <MainMenu />
        </Popup>
      )}
    </MainMenuContext.Provider>
  );
};

export const useMainMenuContext = () => {
  return useContext(MainMenuContext);
};
