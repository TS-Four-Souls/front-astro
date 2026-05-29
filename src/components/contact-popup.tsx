import { Popup } from "./popup";
import { useContactContext } from "./contexts/contact-context";
import { useState } from "react";
import type { ContactType } from "@/shared/api";
import { Button } from "./button";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useToastContext } from "./board/contexts/toast-context";

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
            toast("success", "Report submitted", "Thank you for your report!");
            break;
          case 400:
            toast("error", "Failed to report bug", response.error);
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
          Contact us
        </h1>
        <Button
          onClick={closeContactPopup}
          hotkey="escape"
          hotkeyScope={[HotkeyScope.Popup]}
          label="Close"
        />
      </div>
      <div className="flex flex-row gap-2 max-sm:flex-col">
        <Button
          className="h-16 flex-1"
          label="Contact"
          onClick={() => setType("contact")}
          active={type === "contact"}
        />
        <Button
          className="h-16 flex-1"
          label="Suggestion"
          onClick={() => setType("suggestion")}
          active={type === "suggestion"}
        />
        <Button
          className="h-16 flex-1"
          label="Bug"
          onClick={() => setType("bug")}
          active={type === "bug"}
        />
      </div>
      {type === "bug" && (
        <p className="text-taupe-200">
          In your report, <strong>please include these 3 things</strong>:
          <ul className="list-inside list-disc">
            <li>
              Some <strong>context</strong>, what were you doing when the bug
              happened?
            </li>
            <li>
              What was the <strong>expected</strong> behavior?
            </li>
            <li>
              What was the <strong>actual</strong> behavior?
            </li>
          </ul>
        </p>
      )}
      <div className="flex flex-col gap-2">
        <textarea
          className="h-64 w-full rounded-md border-2 border-taupe-600 bg-taupe-800 px-4 py-2"
          placeholder="What do you want to tell us?"
          value={description}
          minLength={1}
          maxLength={3000}
          required
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-right text-sm text-taupe-400">
          {description.length} / 3000
        </p>
      </div>
      <p className="max-w-170 text-taupe-200">
        <strong>Optional:</strong> we may contact you if we need more
        information or to follow up on your report. Your email address will not
        be used for any other purpose.
      </p>
      <input
        type="email"
        className="w-full rounded-md border-2 border-taupe-600 bg-taupe-800 px-4 py-2"
        placeholder="Your email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {type === "bug" && (
        <p className="text-taupe-200">
          <strong>Note:</strong> your game logs will automatically be included
          in the report.
        </p>
      )}
      <Button
        className="h-16"
        label="Submit"
        theme="onLight"
        onClick={() => submitReport()}
        disabled={description.length < 1 || description.length > 3000}
      />
    </Popup>
  );
};
