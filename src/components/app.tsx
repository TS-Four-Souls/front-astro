import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { GamePage } from "./pages/game-page";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";
import { PopoverProvider } from "./board/contexts/popover-context";
import { ReplayPage } from "./pages/replay-page";
import { ContactProvider } from "./contexts/contact-context";

interface AppProps {
  page: "game" | "replay";
}

export const App = ({ page }: AppProps) => (
  <div className="h-screen w-screen overflow-hidden bg-taupe-800 text-white select-none">
    <HotkeysProvider initiallyActiveScopes={[HotkeyScope.Main]}>
      <PopoverProvider>
        <ToastProvider>
          <ContactProvider>
            <PromptProvider>
              {page === "game" ? <GamePage /> : <ReplayPage />}
            </PromptProvider>
          </ContactProvider>
        </ToastProvider>
      </PopoverProvider>
    </HotkeysProvider>
  </div>
);
