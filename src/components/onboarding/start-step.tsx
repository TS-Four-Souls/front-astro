import { socket } from "@/utils/socket";
import type { Issuer } from "@/shared/api";
import { useState } from "react";

interface StartStepProps {
  issuer: Issuer;
}

export const StartStep = ({ issuer }: StartStepProps) => {
  const [error, setError] = useState<string | null>(null);

  const requestStart = async () => {
    socket.emit("start", { issuer }, (response) => {
      if (response.status === 200) {
        setError(null);
      } else if (response.status === 400) {
        setError(response.error);
      }
    });
  };
  return (
    <div className="grid place-items-center place-content-center h-screen">
      <div className="flex flex-col gap-8 border-2 border-stone-700 p-8 rounded-lg text-center">
        <h1 className="text-xl font-bold">Welcome {issuer.id}!</h1>
        <p className="text-sm text-stone-400">When everyone is ready,<br/>click the button below to start the game</p>
        <button className="bg-stone-600 text-white px-4 py-2 rounded-md hover:bg-stone-500 transition-colors cursor-pointer" onClick={requestStart}>Start</button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};
