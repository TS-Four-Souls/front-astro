import { Button } from "../button";

interface RoomOptionsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export const RoomOptions = ({ onCreateRoom, onJoinRoom }: RoomOptionsProps) => {
  return (
    <>
      <Button
        label="Create a room"
        onClick={onCreateRoom}
        hotkey="1"
        className="h-16 w-120"
        theme="onSpace"
      />
      <Button
        label="Join a room"
        onClick={onJoinRoom}
        hotkey="2"
        className="h-16 w-120"
        theme="onSpace"
      />
    </>
  );
};
