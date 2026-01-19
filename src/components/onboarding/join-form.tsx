import type { Issuer } from "@/shared/api";
import { socket } from "@/utils/socket";
import { useLocalStorage } from "@/utils/use-local-storage";
import { useToastContext } from "../board/contexts/toast-context";

interface JoinFormProps {
  onJoin: (issuer: Issuer) => void;
}

export const JoinForm = ({ onJoin }: JoinFormProps) => {
  const [name, setName] = useLocalStorage<string>("name", "");
  const { toast } = useToastContext();

  const joinGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    socket.emit("join", name, (response) => {
      switch (response.status) {
        case 200:
          onJoin({ id: name, secret: response.secret });
          break;
        case 400:
        default:
          toast("error", "Failed to join game", response.error);
          break;
      }
    });
  };

  return (
    <div className="grid h-screen place-content-center place-items-center">
      <div className="flex flex-col gap-4 rounded-lg border-2 border-stone-700 p-4 text-center">
        <h1 className="text-xl font-bold">Join the game</h1>
        <form onSubmit={joinGame} className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="Enter your name..."
            autoComplete="off"
            minLength={1}
            required
            className="rounded-md bg-stone-800 px-4 py-2 text-white focus:ring-2 focus:ring-stone-500 focus:outline-none"
          />
          <button
            className="cursor-pointer rounded-md bg-stone-600 px-4 py-2 text-white transition-colors hover:bg-stone-500"
            type="submit">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};
