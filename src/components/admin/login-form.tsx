import { socket } from "@/utils/socket";
import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { OnboardingLayout } from "../onboarding-layout";
import { translateError } from "../../utils/translate";
import { t } from "../../utils/translate";

export const LoginForm = () => {
  const { toast } = useToastContext();
  const [password, setPassword] = useState("");

  useEffect(() => {
    const password = storage.getItem("adminPassword");
    if (password) {
      setPassword(password);
    }
  }, []);

  const onLogin = () => {
    storage.setItem("adminPassword", password);
    socket.emit("adminLogin", { password }, (response) => {
      if (response.status === 400)
        toast(
          "error",
          t("front.failLoginAsAdmin"),
          translateError(response.error),
        );
    });
  };

  return (
    <OnboardingLayout withHeader>
      <img src="/logo.png" alt="Logo" className="mb-16 w-140" />
      <div className="flex flex-col gap-8 rounded-lg border-2 border-space-400 bg-space p-8 text-center text-lg max-sm:w-full max-sm:px-4">
        <h1 className="font-main text-3xl font-bold">Admin Login</h1>
        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder={t("front.password")}
            value={password}
            className="rounded-md border-2 border-space-300 bg-space-500 px-4 py-2 text-white focus:ring-2 focus:ring-space-500 focus:outline-none"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onLogin();
              }
            }}
          />
          <Button
            onClick={onLogin}
            label={t("front.login")}
            hotkey="enter"
            theme="onSpace"
          />
          <Button
            label={t("front.return")}
            onClick={() => {
              window.location.href = "/";
            }}
            hotkey="escape"
            theme="onSpace"
          />
        </div>
      </div>
    </OnboardingLayout>
  );
};
