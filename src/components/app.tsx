import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { GamePage } from "./pages/game-page";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HotkeyScope } from "@/utils/hotkey";
import { PopoverProvider } from "./board/contexts/popover-context";
import { ReplayPage } from "./pages/replay-page";
import { ContactProvider } from "./contexts/contact-context";
import { AdminPage } from "./pages/admin-page";
import { LanguageProvider } from "./contexts/language-context";

interface AppProps {
  page: "game" | "replay" | "admin";
}

export const App = ({ page }: AppProps) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-taupe-800 text-white select-none">
      <LanguageProvider>
        <HotkeysProvider initiallyActiveScopes={[HotkeyScope.Main]}>
          <PopoverProvider>
            <ToastProvider>
              <ContactProvider>
                <PromptProvider>
                  {page === "game" ? (
                    <GamePage />
                  ) : page === "replay" ? (
                    <ReplayPage />
                  ) : (
                    <AdminPage />
                  )}
                </PromptProvider>
              </ContactProvider>
            </ToastProvider>
          </PopoverProvider>
        </HotkeysProvider>
      </LanguageProvider>
    </div>
  );
};
