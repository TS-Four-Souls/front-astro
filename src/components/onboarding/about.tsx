import { HotkeyScope } from "@/utils/hotkey";
import { Button } from "../button";
import { PileIndicator } from "@/icons/pile-indicator";

interface AboutProps {
  onClose: () => void;
}

export const About = ({ onClose }: AboutProps) => {
  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-8 w-[20vh]" />
      <Button
        label="Close"
        onClick={onClose}
        hotkey="escape"
        hotkeyScope={[HotkeyScope.Main]}
        theme="onSpace"
      />
      <div className="flex max-h-[60vh] max-w-3xl flex-col gap-8 overflow-auto rounded-lg border-2 border-space-400 bg-space p-8 pb-16 select-text">
        <h1 className="mb-4 text-center font-main text-4xl font-bold">About</h1>
        <div className="flex flex-col gap-4 text-lg leading-relaxed">
          <p>
            <u>Four Online Souls</u> is a fan-made recreation of the board game{" "}
            <a
              href="https://foursouls.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-100 underline">
              The Binding of Isaac: Four Souls
            </a>{" "}
            as a digital, online game, that can be played directly in the web
            browser.
          </p>
          <p>
            We support playing with 2 to 4 players. The game logic is fully
            implemented: card effects, stack, turn structure... So far, we’ve
            only implemented the base game cards, but we plan to add additional
            sets such as <u>Four Souls+</u> and <u>Requiem</u>.
          </p>
        </div>
        <h2 className="mt-8 mb-2 text-center font-main text-3xl font-bold">
          Tips
        </h2>
        <ul className="flex list-inside list-disc flex-col gap-4 leading-relaxed">
          <li>
            Familiarize yourself with the rules by reading the{" "}
            <a
              href="https://foursouls.com/rules"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-100 underline">
              official rules
            </a>
            .
          </li>
          <li>
            While not strictly required, we expect players to be able to{" "}
            <strong>talk to each other</strong> during their game. To not slow
            down the game,{" "}
            <a
              href="https://foursouls.com/rules/extended-rulebook/#priority"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-100 underline">
              priorities
            </a>{" "}
            are not explictly managed. Don't hesitate to interupt someone's turn
            to do an action. The <strong>rollback</strong> feature is available
            to undo the last actions if necessary.
          </li>
          <li>
            During{" "}
            <a
              href="https://foursouls.com/rules/extended-rulebook/#bartering"
              target="_blank"
              rel="noopener noreferrer"
              className="text-space-100 underline">
              bartering
            </a>{" "}
            You can <strong>give ¢</strong> to other players by cliking on their{" "}
            <img
              src="/coin.png"
              alt="Give coins"
              className="inline-block size-5"
            />{" "}
            icon.
          </li>
          <li>
            You can press on the{" "}
            <PileIndicator className="inline-block size-6" /> icon at the bottom
            left corner of a pile of cards to see all the cards in the pile.
            (e.g: browsing the discards, seeing the covered monster cards...)
          </li>
          <li>
            We took a few liberties with the rules to handle edge cases. For
            exemple, we prevent players from entering an infinite loop due to
            card synergies.
          </li>
          <li>
            Most actions and selections can be done using keyboard shortcuts.
            The shortcut is displayed at the top left corner of a button or
            card. For exemple, there is an{" "}
            <img
              src="/input-prompts/keyboard_escape_outline.svg"
              title="Escape"
              className="inline-block size-8"
            />{" "}
            icon on the <span className="px-1 font-main">CLOSE</span> button of
            this page.
          </li>
          <li>
            Some stack elements can be <strong>reordered</strong>. To do so,
            click on the element, destination lines will appear. Click on a
            destination line to move the element there.
          </li>
        </ul>
        <h2 className="mt-8 mb-4 text-center font-main text-3xl font-bold">
          Credits
        </h2>
        <ul className="flex flex-wrap justify-center gap-16 text-center font-main text-lg">
          <CreditsItem
            name="Sylvain Lichau"
            role="Development"
            image="/sylvain.jpg"
          />
          <CreditsItem
            name="Dr_Mint"
            role="Development"
            image="/drmint.jpg"
            link="https://github.com/drmint"
          />
          <CreditsItem
            name="drag.on.ink"
            role="Additional visual assets"
            image="/dragonink.jpg"
            link="https://www.instagram.com/drag.on.ink"
          />
        </ul>
        <p className="mt-4 text-center">
          The original board game,{" "}
          <a
            href="https://foursouls.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-space-100 underline">
            The Binding of Isaac: Four Souls
          </a>{" "}
          was created by Edmund McMillen and Maestro Media.
        </p>
        <h2 className="mt-8 mb-2 text-center font-main text-3xl font-bold">
          Legal & Privacy
        </h2>
        <p className="leading-relaxed">
          This is an unofficial, fan-made website and is not affiliated with or
          endorsed by Maestro Media and Edmund McMillen.
        </p>
        <div className="flex flex-col gap-2 leading-relaxed">
          <h3 className="mt-4 mb-2 font-main text-2xl font-bold">
            Data collection
          </h3>
          <p>
            Your <strong>username</strong> is stored during the duration of the
            game to identify you among other players. It is deleted from our
            servers after the game is over.
          </p>
          <p>
            Rooms and all associated data are deleted from our servers after 3
            hours of inactivity or if the host leaves the room.
          </p>
          <p>
            A record of your <strong>games</strong> are anonymized and archived
            indefinitely to help us diagnose bugs.
          </p>
          <p>
            If you submit a bug report, your <strong>game logs</strong> will be
            included in the report. Your email address is optional and will not
            be used for any other purpose than to contact you if we need more
            information or to follow up on your report.
          </p>
          <p>
            We store some information in your browser's local storage to improve
            your experience:
          </p>
          <ul className="list-inside list-disc">
            <li>
              Your <strong>username</strong> <code>(name)</code> so that you
              don't have to re-enter it every time you join a room
            </li>
            <li>
              Your <strong>current room</strong> <code>(roomId)</code> to
              automatically rejoin a room if you refresh the page
            </li>
            <li>
              Your <strong>user ID</strong> <code>(userId)</code> to
              authenticate your actions during the game
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

interface CreditsItemProps {
  name: string;
  role: string;
  image: string;
  link?: string;
}

const CreditsItem = ({ name, role, image, link }: CreditsItemProps) => {
  return (
    <li className="flex flex-col items-center">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <img
            src={image}
            alt=""
            draggable={false}
            className="size-32 rounded-xl border-3 border-white"
          />
        </a>
      ) : (
        <img
          src={image}
          alt=""
          draggable={false}
          className="size-32 rounded-xl border-3 border-white"
        />
      )}
      <p className="mt-4 mb-2 uppercase">{name}</p>
      <p className="text-sm">{role}</p>
    </li>
  );
};
