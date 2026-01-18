import { socket } from "@/utils/socket";
import { useGameContext } from "./useGameContext";

export const Stack = () => {
    const { state, issuer } = useGameContext();

    const resolveStack = () => {
        socket.emit("resolve", { issuer }, (response) => {
            if (response.status === 200) {
                console.log("Stack resolved");
            } else {
                console.error("Failed to resolve stack", response);
            }
        });
    }

    return (
        <div className="grid h-86 w-60 place-items-center place-content-center rounded-xl bg-stone-900 text-stone-500">
            Stack
            <button onClick={resolveStack} className="w-full bg-stone-600 not-disabled:cursor-pointer text-white px-2 py-1 rounded-md not-disabled:hover:bg-stone-500 transition-colors">Resolve</button>
        </div>
    )
}