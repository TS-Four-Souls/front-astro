import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { DebugPage } from "./pages/debug-page";
import { GamePage } from "./pages/game-page";
import { UserSettingsProvider } from "./board/contexts/user-settings-context";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";
import { PopoverProvider } from "./board/contexts/popover-context";

interface AppProps {
  page: "debug" | "game";
}

export const App = ({ page }: AppProps) => (
  <div className="min-h-screen w-screen overflow-hidden bg-stone-800 text-white">
    <HotkeysProvider initiallyActiveScopes={[HotkeyScope.Main]}>
      <PopoverProvider>
        <UserSettingsProvider>
          <ToastProvider>
            <PromptProvider>
              {page === "debug" ? <DebugPage /> : <GamePage />}
            </PromptProvider>
          </ToastProvider>
        </UserSettingsProvider>
      </PopoverProvider>
    </HotkeysProvider>
  </div>
);
