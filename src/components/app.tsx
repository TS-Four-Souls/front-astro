import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { GamePage } from "./pages/game-page";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";
import { PopoverProvider } from "./board/contexts/popover-context";

export const App = () => (
  <div className="h-screen w-screen overflow-hidden bg-stone-800 text-white select-none">
    <HotkeysProvider initiallyActiveScopes={[HotkeyScope.Main]}>
      <PopoverProvider>
        <ToastProvider>
          <PromptProvider>
            <GamePage />
          </PromptProvider>
        </ToastProvider>
      </PopoverProvider>
    </HotkeysProvider>
  </div>
);
