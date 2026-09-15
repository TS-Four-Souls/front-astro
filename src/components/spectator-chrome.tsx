import type { Room } from "@/shared/api";
import { CC } from "@/icons/cc";
import { Eye } from "@/icons/eye";
import { Share } from "@/icons/share";
import { cn } from "@/utils/cn";
import { LANGUAGE_CODE } from "@/utils/translate";
import { socket } from "@/utils/socket";
import { useEffect, useRef, useState } from "react";
import { useToastContext } from "./board/contexts/toast-context";
import { Button } from "./button";
import { useLanguageContext } from "./contexts/language-context";
import { ElapsedTime } from "./elapsed-time";
import { languageLabelMap } from "./language-selection";

interface SpectatorChromeProps {
  room: Room | null;
  children: React.ReactNode;
  onJoinAsPlayer: () => void;
}

export const SpectatorChrome = ({
  room,
  children,
  onJoinAsPlayer,
}: SpectatorChromeProps) => {
  const { t, language, setLanguage, translateError } = useLanguageContext();
  const { toast } = useToastContext();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const buttonTheme = room?.game ? "default" : "onSpace";

  useEffect(() => {
    if (!languageMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [languageMenuOpen]);

  if (!room?.isSpectator) {
    return <div className="h-screen w-screen">{children}</div>;
  }

  const canJoin = room.capabilities.join === true;

  const leaveRoom = () => {
    socket.emit("leaveRoom", (response) => {
      if (response.status === 400) {
        toast(
          "error",
          t("gameStep.spectatorBar.leaveButton.errorToast.title"),
          translateError(response.error),
        );
      }
    });
  };

  const shareRoom = () => {
    const currentUrl = new URL(window.location.href);
    const link = new URL(`/?code=${room.id}`, currentUrl.origin);
    navigator.clipboard.writeText(link.toString());
    toast(
      "success",
      t("gameStep.spectatorBar.shareButton.successToast.title"),
      t("gameStep.spectatorBar.shareButton.successToast.message"),
    );
  };

  return (
    <div className="box-border flex h-screen w-screen flex-col gap-4 bg-black p-4">
      <div className="flex h-11 shrink-0 items-center gap-3 bg-black text-white">
        <Button
          label={t("gameStep.spectatorBar.leaveButton.label")}
          onClick={leaveRoom}
          theme={buttonTheme}
          className="shrink-0"
        />
        <div className="flex grow items-center justify-center gap-8">
          <p className="font-main text-xl font-bold">
            {t("gameStep.spectatorBar.title")}
          </p>
          <div className="flex items-center gap-1.5">
            <Eye className="size-5" />
            <span className="font-alt-stats text-xs">
              {room.spectatorCount}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-taupe-900 px-4 py-1">
            <span
              className="size-2 shrink-0 animate-pulse rounded-full bg-red-500"
              aria-hidden
            />
            <ElapsedTime since={room.createdAt} className="text-taupe-300" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <Button
            label={<Share className="size-5" />}
            onClick={shareRoom}
            theme={buttonTheme}
            className="size-10 p-0"
            tooltip={{
              title: t("gameStep.spectatorBar.shareButton.label"),
              enabled: true,
            }}
          />
          <div ref={languageMenuRef} className="relative">
            <Button
              label={<CC className="size-5" />}
              onClick={() => setLanguageMenuOpen((open) => !open)}
              active={languageMenuOpen}
              theme={buttonTheme}
              className="size-10 p-0"
              tooltip={{
                title: t("languageSelectionButton.tooltip.title"),
                content: t("languageSelectionButton.tooltip.message"),
                enabled: !languageMenuOpen,
              }}
            />
            {languageMenuOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-md bg-taupe-800 shadow-xl inset-shadow-xs inset-shadow-taupe-100/10">
                {Object.values(LANGUAGE_CODE).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={cn(
                      "block w-full cursor-pointer px-4 py-2.5 text-left font-main text-sm text-white uppercase transition-[colors,filter] hover:brightness-120",
                      language === code
                        ? "bg-taupe-500"
                        : "bg-taupe-800 hover:bg-taupe-700",
                    )}
                    onClick={() => {
                      setLanguage(code);
                      setLanguageMenuOpen(false);
                    }}>
                    {languageLabelMap[code]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            label={t("gameStep.spectatorBar.joinButton.label")}
            onClick={() => {
              if (!canJoin) return;
              onJoinAsPlayer();
            }}
            disabled={!canJoin}
            tooltip={{ capable: room.capabilities.join }}
            theme={buttonTheme}
            className="shrink-0"
          />
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
        {children}
      </div>
    </div>
  );
};
