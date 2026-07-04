import type { ContactType } from "@/shared/api";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useState } from "react";
import { useToastContext } from "./board/contexts/toast-context";
import { Button } from "./button";
import { useContactContext } from "./contexts/contact-context";
import { Popup } from "./popup";
import { translateError, t } from "../utils/translate";

const MAX_LENGTH = 3000;

export const ContactPopup = () => {
  const { isContactPopupOpen, closeContactPopup } = useContactContext();
  const [type, setType] = useState<ContactType>("contact");
  const [description, setDescription] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const { toast } = useToastContext();

  const resetForm = () => {
    setType("contact");
    setDescription("");
    setEmail("");
  };

  const submitReport = () => {
    socket.emit(
      "contact",
      {
        type,
        description,
        email: email.length > 0 ? email : undefined,
      },
      (response) => {
        switch (response.status) {
          case 200:
            closeContactPopup();
            resetForm();
            toast(
              "success",
              t("contactButton.popup.successToast.title"),
              t("contactButton.popup.successToast.message"),
            );
            break;
          case 400:
            toast(
              "error",
              t("contactButton.popup.errorToast.title"),
              translateError(response.error),
            );
            break;
        }
      },
    );
  };

  if (!isContactPopupOpen) return null;
  return (
    <Popup onPressBackdrop={closeContactPopup} className="overflow-auto">
      <div className="flex flex-row justify-between gap-8 max-xs:flex-col">
        <h1 className="font-alt-stats text-2xl leading-tight font-bold uppercase">
          {t("contactButton.popup.title")}
        </h1>
        <Button
          onClick={closeContactPopup}
          hotkey="escape"
          hotkeyScope={[HotkeyScope.Popup]}
          label={t("common.closeButton")}
        />
      </div>
      <div className="flex flex-row gap-2 max-sm:flex-col">
        <Button
          className="h-16 flex-1"
          label={t("contactButton.popup.subjects.contact")}
          onClick={() => setType("contact")}
          active={type === "contact"}
        />
        <Button
          className="h-16 flex-1"
          label={t("contactButton.popup.subjects.suggestion")}
          onClick={() => setType("suggestion")}
          active={type === "suggestion"}
        />
        <Button
          className="h-16 flex-1"
          label={t("contactButton.popup.subjects.bug")}
          onClick={() => setType("bug")}
          active={type === "bug"}
        />
      </div>
      {type === "bug" && (
        <p className="whitespace-pre-line text-taupe-200">
          {t("contactButton.popup.subjectBugDescription")}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <textarea
          className="h-64 w-full rounded-md border-2 border-taupe-600 bg-taupe-800 px-4 py-2"
          placeholder={t("contactButton.popup.message.placeholder")}
          value={description}
          minLength={1}
          maxLength={MAX_LENGTH}
          required
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-right text-sm text-taupe-400">
          {t("contactButton.popup.message.counter", {
            length: description.length,
            maxLength: MAX_LENGTH,
          })}
        </p>
      </div>
      <p className="max-w-170 text-taupe-200">
        {t("contactButton.popup.email.disclaimer")}
      </p>
      <input
        type="email"
        className="w-full rounded-md border-2 border-taupe-600 bg-taupe-800 px-4 py-2"
        placeholder={t("contactButton.popup.email.placeholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {type === "bug" && (
        <p className="text-taupe-200">
          {t("contactButton.popup.subjectBugGameDataNote")}
        </p>
      )}
      <Button
        className="h-16"
        label={t("common.submitButton")}
        theme="onLight"
        onClick={() => submitReport()}
        disabled={description.length < 1 || description.length > 3000}
      />
    </Popup>
  );
};
