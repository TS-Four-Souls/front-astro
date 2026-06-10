import { createContext, useContext, useState } from "react";
import { ReplyPopup } from "./reply-popup";
import type { AdminMessage } from "@/shared/api";

interface ReplyContextProps {
  openReplyPopup: (message: AdminMessage) => void;
  closeReplyPopup: () => void;
  isReplyPopupOpen: { message: AdminMessage } | false;
}

const ReplyContext = createContext<ReplyContextProps>({
  openReplyPopup: () => {},
  closeReplyPopup: () => {},
  isReplyPopupOpen: false,
});

export const ReplyProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReplyPopupOpen, setIsReplyPopupOpen] = useState<
    { message: AdminMessage } | false
  >(false);

  const openReplyPopup = (message: AdminMessage) => {
    setIsReplyPopupOpen({ message });
  };

  const closeReplyPopup = () => {
    setIsReplyPopupOpen(false);
  };

  return (
    <ReplyContext.Provider
      value={{ isReplyPopupOpen, openReplyPopup, closeReplyPopup }}>
      {children}
      <ReplyPopup />
    </ReplyContext.Provider>
  );
};

export const useReplyContext = () => {
  return useContext(ReplyContext);
};
