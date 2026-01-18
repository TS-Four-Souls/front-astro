import { PromptProvider } from "./board/contexts/prompt-context";
import { ToastProvider } from "./board/contexts/toast-context";
import { DebugPage } from "./pages/debug-page";
import { GamePage } from "./pages/game-page";
import { UserSettingsProvider } from "./board/contexts/user-settings-context";

interface AppProps {
  page: "debug" | "game";
}

export const App = ({ page }: AppProps) => {
  return (
    <div className="min-h-screen w-screen overflow-hidden bg-stone-800 text-white">
      <UserSettingsProvider>
        <ToastProvider>
          <PromptProvider>
            {page === "debug" ? <DebugPage /> : <GamePage />}
          </PromptProvider>
        </ToastProvider>
      </UserSettingsProvider>
    </div>
  );
};
