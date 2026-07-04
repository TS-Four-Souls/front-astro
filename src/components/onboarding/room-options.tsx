import { Button } from "../button";
import { t } from "../../utils/translate";

interface RoomOptionsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onAbout: () => void;
}

export const RoomOptions = ({
  onCreateRoom,
  onJoinRoom,
  onAbout,
}: RoomOptionsProps) => {
  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-16 w-140 max-sm:w-full" />
      <Button
        label={t("introStep.titleScreen.createRoomButton")}
        onClick={onCreateRoom}
        hotkey="1"
        className="h-16 w-100 text-lg max-sm:w-full"
        theme="onSpace"
      />
      <Button
        label={t("introStep.titleScreen.joinRoomButton")}
        onClick={onJoinRoom}
        hotkey="2"
        className="h-16 w-100 text-lg max-sm:w-full"
        theme="onSpace"
      />
      <Button
        label={t("introStep.titleScreen.aboutButton")}
        hotkey="escape"
        onClick={onAbout}
        className="h-16 px-16 text-lg max-sm:w-2/3"
        theme="onSpace"
      />
    </>
  );
};
