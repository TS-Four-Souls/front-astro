import { Button } from "../button";
import { ENVIRONMENT } from "astro:env/client";
import { useLanguageContext } from "../contexts/language-context";

interface RoomOptionsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onAbout: () => void;
}

export const RoomOptions = ({
  onCreateRoom,
  onJoinRoom,
  onAbout,
}: RoomOptionsProps) => {
  const { t } = useLanguageContext();
  return (
    <>
      <div className="relative">
        <img src="/logo.png" alt="Logo" className="mb-16 w-140 max-sm:w-full" />
        {ENVIRONMENT === "beta" && (
          <div className="absolute top-12 right-0 left-0 flex place-content-center not-sm:text-[3vw] lg:top-16 lg:translate-x-24 lg:place-content-end">
            <p className="animate-craftmine font-time-fcuk text-yellow-300 text-shadow-[0px_0.2em_0px,0px_0.1em_0px] text-shadow-black lg:rotate-12">
              {t("introStep.titleScreen.betaIndicator")}
            </p>
          </div>
        )}
      </div>
      <Button
        label={t("introStep.titleScreen.createRoomButton")}
        onClick={onCreateRoom}
        hotkey="1"
        className="h-16 w-100 text-lg max-sm:w-full"
        theme="onSpace"
      />
      <Button
        label={t("introStep.titleScreen.joinRoomButton")}
        onClick={onJoinRoom}
        hotkey="2"
        className="h-16 w-100 text-lg max-sm:w-full"
        theme="onSpace"
      />
      <Button
        label={t("introStep.titleScreen.aboutButton")}
        hotkey="escape"
        onClick={onAbout}
        className="h-16 px-16 text-lg max-sm:w-2/3"
        theme="onSpace"
      />
    </>
  );
};
