import { socket } from "@/utils/socket";
import type { Issuer } from "@/shared/api";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";

interface StartStepProps {
  issuer: Issuer;
}

export const StartStep = ({ issuer }: StartStepProps) => {
  const { toast } = useToastContext();

  const requestStart = async () => {
    socket.emit("start", { issuer }, (response) => {
      switch (response.status) {
        case 200:
          break;
        case 400:
        default:
          toast("error", "Failed to start game", response.error);
          break;
      }
    });
  };

  return (
    <div className="grid h-screen place-content-center place-items-center">
      <div className="flex flex-col gap-8 rounded-lg border-2 border-stone-700 p-8 text-center">
        <h1 className="font-main text-3xl font-bold">Welcome {issuer.id}!</h1>
        <p className="leading-normal text-stone-400">
          When everyone is ready,
          <br />
          click the button below to start the game
        </p>
        <Button onClick={requestStart} label="Start" />
      </div>
    </div>
  );
};
