import { createContext, useContext, useState } from "react";
import { ContactPopup } from "../contact-popup";

interface ContactContextProps {
  openContactPopup: () => void;
  closeContactPopup: () => void;
  isContactPopupOpen: boolean;
}

const ContactContext = createContext<ContactContextProps>({
  openContactPopup: () => {},
  closeContactPopup: () => {},
  isContactPopupOpen: false,
});

export const ContactProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);

  const openContactPopup = () => {
    setIsContactPopupOpen(true);
  };

  const closeContactPopup = () => {
    setIsContactPopupOpen(false);
  };

  return (
    <ContactContext.Provider
      value={{ isContactPopupOpen, openContactPopup, closeContactPopup }}>
      {children}
      <ContactPopup />
    </ContactContext.Provider>
  );
};

export const useContactContext = () => {
  return useContext(ContactContext);
};
