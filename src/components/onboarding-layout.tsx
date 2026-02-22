import { cn } from "@/utils/cn";

interface OnboardingLayoutProps {
  headerMode: boolean;
  children: React.ReactNode;
}

export const OnboardingLayout = ({
  headerMode,
  children,
}: OnboardingLayoutProps) => {
  return (
    <div className="flex h-screen gap-8">
      <div className="planetarium flex flex-2 flex-col">
        <div
          className={cn(
            "flex flex-1 flex-col place-content-center place-items-center gap-6 p-12",
            headerMode && "place-content-start place-items-start",
          )}>
          <img
            src="/logo.png"
            alt="Logo"
            className={cn("mb-8 w-[30vw]", headerMode && "h-28 w-auto")}
          />
          {children}
        </div>
        <p className="mx-16 mb-4 text-center font-alt-stats text-blue-200/60">
          This is an unofficial, fan-made website and is not affiliated with
          <br /> or endorsed by Maestro Media and Edmund McMillen.
        </p>
      </div>
    </div>
  );
};
