import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { t, toSeriTrans, translateError } from "../translation/translate";

interface CreateRoomFormProps {
  onCancel: () => void;
}

export const CreateRoomForm = ({ onCancel }: CreateRoomFormProps) => {
  const [name, setName] = useState("");
  const { toast } = useToastContext();

  useEffect(() => {
    const name = storage.getItem("name");
    if (name) {
      setName(name);
    }
  }, []);

  const createRoom = () => {
    storage.setItem("name", name);
    socket.emit("createRoom", { name }, (response) => {
      if (response.status === 400)
        toast("error", toSeriTrans("front.failCreateRoom"), translateError(response.error));
    });
  };

  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-16 w-140" />
      <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
        <h1 className="font-main text-3xl font-bold">Welcome!</h1>
        <div className="flex flex-col gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                createRoom();
              } else if (e.key === "Escape") {
                onCancel();
              }
            }}
            type="text"
            placeholder={t(toSeriTrans("front.enterYourName"))}
            autoComplete="off"
            minLength={1}
            maxLength={16}
            required
            autoFocus
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
          />
          <Button
            label={t(toSeriTrans("front.join"))}
            onClick={createRoom}
            hotkey="enter"
            theme="onSpace"
          />
          <Button
            label={t(toSeriTrans("front.leave"))}
            onClick={onCancel}
            hotkey="escape"
            theme="onSpace"
          />
        </div>
      </div>
    </>
  );
};
