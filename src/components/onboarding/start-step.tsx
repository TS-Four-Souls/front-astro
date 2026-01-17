import { socket } from "@/utils/socket";
import type { Issuer } from "@/shared/api";

interface StartStepProps {
  issuer: Issuer;
}

export const StartStep = ({ issuer }: StartStepProps) => {
  const requestStart = async () => {
    socket.emit("start", { issuer }, (response) => {
      if (response.status === 400) {
        console.error("Failed to start the game", response.error);
      }
    });
  };
  return (
    <div>
      <h1>Start step</h1>
      <button onClick={requestStart}>Start</button>
    </div>
  );
};
