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
  return (
    <div className="flex h-screen gap-8">
      <div className="planetarium flex flex-2 flex-col">
        <ReportBugButton />
        {withHeader ? (
          <>
            <div className="flex flex-1 flex-col place-content-center place-items-center gap-6 p-12">
              <img src="/logo.png" alt="Logo" className="mb-8 w-[30vw]" />
              {children}
            </div>
            <p className="mx-16 mb-4 text-center font-alt-stats text-blue-200/60">
              This is an unofficial, fan-made website and is not affiliated with
              <br /> or endorsed by Maestro Media and Edmund McMillen.
            </p>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

const ReportBugButton = () => {
  const tooltip = useTooltip({
    enabled: true,
    title: "Contact us",
    content: "A suggestion, a bug to report?",
  });
  const { openContactPopup } = useContactContext();
  return (
    <img
      src="/contact.png"
      className="pixelated absolute right-10 bottom-10 w-16 cursor-pointer rounded-full bg-space-400 p-2 shadow-xl/50"
      onMouseEnter={tooltip.setTooltip}
      onMouseLeave={tooltip.closeTooltip}
      onClick={openContactPopup}
    />
  );
};
