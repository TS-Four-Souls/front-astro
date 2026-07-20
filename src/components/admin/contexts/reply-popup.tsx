import { socket } from "@/utils/socket";
import { Button } from "../../button";
import { Popup } from "../../popup";
import { useReplyContext } from "./reply-context";
import { HotkeyScope } from "@/utils/hotkey";
import { useState } from "react";
import { useToastContext } from "../../board/contexts/toast-context";
import { useLanguageContext } from "@/components/contexts/language-context";

export const ReplyPopup = () => {
  const { toast } = useToastContext();
  const { isReplyPopupOpen, closeReplyPopup } = useReplyContext();
  const [response, setResponse] = useState<string>("");
  const { translateError } = useLanguageContext();

  const resetForm = () => {
    setResponse("");
  };

  const submitReply = () => {
    if (!isReplyPopupOpen) return;
    const message = isReplyPopupOpen.message;
    socket.emit(
      "adminReplyToMessage",
      { id: message.id, message: response },
      (response) => {
        switch (response.status) {
          case 400:
          case 500:
            toast(
              "error",
              "Failed to reply to message",
              translateError(response.error),
            );
            break;
          case 200:
            closeReplyPopup();
            resetForm();
            toast(
              "success",
              "Reply sent",
              "Your reply has been sent to the user.",
            );
            break;
        }
      },
    );
  };

  if (!isReplyPopupOpen) return null;
  return (
    <Popup>
      <div className="flex flex-row justify-between gap-8 max-xs:flex-col">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          Reply to message
        </h1>
        <Button
          onClick={closeReplyPopup}
          hotkey="escape"
          hotkeyScope={[HotkeyScope.Popup]}
          label="Close"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="mb-2 flex flex-col gap-2 rounded-md bg-taupe-600 p-4 select-text">
          <p>
            From:{" "}
            <span className="font-bold">{isReplyPopupOpen.message.email}</span>
          </p>
          <p className="max-w-170 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {isReplyPopupOpen.message.description}
          </p>
        </div>
        <textarea
          className="h-64 w-full rounded-md border-2 border-taupe-600 bg-taupe-800 px-4 py-2"
          placeholder="What is your reply?"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
      </div>
      <Button
        className="h-16"
        label="Submit"
        theme="onLight"
        onClick={submitReply}
        disabled={response.length < 1}
      />
    </Popup>
  );
};
