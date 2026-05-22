import { Button } from "../button";

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
      <img src="/logo.png" alt="Logo" className="mb-16 w-[50vh]" />
      <Button
        label="Create a room"
        onClick={onCreateRoom}
        hotkey="1"
        className="h-16 w-100 text-lg"
        theme="onSpace"
      />
      <Button
        label="Join a room"
        onClick={onJoinRoom}
        hotkey="2"
        className="h-16 w-100 text-lg"
        theme="onSpace"
      />
      <Button
        label="About"
        hotkey="escape"
        onClick={onAbout}
        className="h-16 px-16 text-lg"
        theme="onSpace"
      />
    </>
  );
};
