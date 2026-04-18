import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { GamePage } from "./pages/game-page";
import { UserSettingsProvider } from "./board/contexts/user-settings-context";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";
import { PopoverProvider } from "./board/contexts/popover-context";

export const App = () => (
  <div className="min-h-screen w-screen overflow-hidden bg-stone-800 text-white">
    <HotkeysProvider initiallyActiveScopes={[HotkeyScope.Main]}>
      <PopoverProvider>
        <UserSettingsProvider>
          <ToastProvider>
            <PromptProvider>
              <GamePage />
            </PromptProvider>
          </ToastProvider>
        </UserSettingsProvider>
      </PopoverProvider>
    </HotkeysProvider>
  </div>
);
