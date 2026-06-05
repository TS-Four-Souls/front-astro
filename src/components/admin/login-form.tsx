import { OnboardingLayout } from "../onboarding-layout";
import { Button } from "../button";
import { useEffect, useState } from "react";
import { socket } from "@/utils/socket";
import { useToastContext } from "../board/contexts/toast-context";
import { storage } from "@/utils/storage";

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
        toast("error", "Failed to login as admin", response.error);
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
            placeholder="Password"
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
            label="Login"
            hotkey="enter"
            theme="onSpace"
          />
        </div>
      </div>
    </OnboardingLayout>
  );
};
