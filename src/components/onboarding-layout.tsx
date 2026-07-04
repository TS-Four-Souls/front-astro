import { useEffect, useRef } from "react";
import { t } from "../utils/translate";
import { useMainMenuContext } from "./board/contexts/main-menu-context";
import { useTooltip } from "./board/use-tooltip";
import { useContactContext } from "./contexts/contact-context";

interface OnboardingLayoutProps {
  withHeader: boolean;
  children: React.ReactNode;
}

export const OnboardingLayout = ({
  withHeader,
  children,
}: OnboardingLayoutProps) => {
  const planetariumRef = useRef<HTMLDivElement>(null);

  // Only animate the planetarium if there is no header and the page is visible
  useEffect(() => {
    const planetarium = planetariumRef.current;
    if (!planetarium) return;

    if (!withHeader) {
      planetarium.classList.remove("animate-planetarium");
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        planetarium.classList.add("animate-planetarium");
      } else {
        planetarium.classList.remove("animate-planetarium");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    handleVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [withHeader]);

  return (
    <div className="flex h-screen gap-8">
      <div
        ref={planetariumRef}
        className="planetarium flex flex-2 flex-col overflow-auto">
        <ReportBugButton />
        {withHeader ? (
          <>
            <div className="mb-8 flex flex-1 flex-col place-content-center place-items-center gap-6 p-12 max-sm:p-6">
              {children}
            </div>
            <a
              href="/privacy"
              className="mb-2 text-center font-alt-stats text-blue-200/60 hover:underline">
              {t("introStep.footer.privacyPolicyLink")}
            </a>
            <p className="mb-4 text-center font-alt-stats whitespace-pre-line text-blue-200/60 max-sm:mx-0">
              {t("introStep.footer.disclaimer")}
            </p>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export const ReportBugButton = () => {
  const tooltip = useTooltip({
    enabled: true,
    title: t("contactButton.tooltip.title"),
    content: t("contactButton.tooltip.message"),
  });
  const { openContactPopup } = useContactContext();
  const { closeMenu: closeMainMenu } = useMainMenuContext();
  return (
    <img
      src="/contact.png"
      className="pixelated absolute right-10 bottom-10 w-16 cursor-pointer rounded-full bg-space-500 p-2 shadow-xl/50 inset-shadow-xs inset-shadow-taupe-100/10 transition-[filter] hover:brightness-120 active:brightness-150"
      onMouseEnter={tooltip.setTooltip}
      onMouseLeave={tooltip.closeTooltip}
      onClick={() => {
        openContactPopup();
        closeMainMenu();
      }}
    />
  );
};
