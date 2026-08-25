import { Gear } from "@/icons/gear";
import { PileIndicator } from "@/icons/pile-indicator";
import { HotkeyScope } from "@/utils/hotkey";
import { Button } from "../button";
import { useLanguageContext } from "../contexts/language-context";

interface AboutProps {
  onClose: () => void;
}

export const About = ({ onClose }: AboutProps) => {
  const { t } = useLanguageContext();
  return (
    <>
      <img src="/logo.png" alt="Logo" className="mb-8 w-80" />
      <Button
        label={t("common.closeButton")}
        onClick={onClose}
        hotkey="escape"
        hotkeyScope={[HotkeyScope.Main]}
        theme="onSpace"
      />
      <div className="flex max-h-[calc(100vh-600px)] min-h-120 max-w-3xl flex-col gap-8 overflow-auto rounded-lg border-2 border-space-400 bg-space p-8 pb-16 select-text">
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
            The board game has been duly recreated, with the added comfort of
            all the rules, turn structure, and effects triggering on their own:
            no need to worry about remembering your cards' passive effects or
            how many loot plays you currently have.
          </p>
          <p>
            Right now, only the base game is available. But we plan on adding
            other sets such as Four Souls+ and Requiem. Still, you can already
            have fun creating custom decks by having multiple instances of the
            same card or removing unwanted cards.
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
          <li>
            Did you find a bug, have a question or suggestion? You can message
            us by clicking on the{" "}
            <img src="/contact.png" className="inline-block size-8" /> icon in
            the bottom-right corner. While in game, you need to open the main
            menu (by pressing{" "}
            <img
              src="/input-prompts/keyboard_escape_outline.svg"
              title="Escape"
              className="inline-block size-8"
            />{" "}
            or clicking on the <Gear className="inline-block size-5" /> icon )
            to access it.
          </li>
        </ul>
        <h2 className="mt-8 text-center font-main text-3xl font-bold">
          Credits
        </h2>
        <p className="max-w-124 self-center text-center">
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
        <h3 className="mt-4 mb-2 text-center font-main text-2xl font-bold">
          Development
        </h3>
        <ul className="flex flex-wrap justify-center gap-16 text-center font-main text-lg">
          <CreditsItem name="Sylvain Lichau" image="/sylvain.jpg" />
          <CreditsItem
            name="Dr_Mint"
            image="/drmint.jpg"
            link="https://github.com/drmint"
          />
        </ul>
        <h3 className="mt-8 text-center font-main text-2xl font-bold">Icons</h3>
        <CreditsItem name="Meigasuu" image="/mei.png" />
        <h3 className="mt-4 mb-2 text-center font-main text-2xl font-bold">
          Brazilian Portuguese translation
        </h3>
        <ul className="flex flex-wrap justify-center gap-16 text-center font-main text-lg">
          <CreditsItem name="chocolover80" image="/avatar_chocolover80.jpeg" />
          <CreditsItem name="BlackStripes" image="/avatar_blackStripes.png" />
        </ul>
        <h3 className="mt-8 text-center font-main text-2xl font-bold">
          Spanish translation
        </h3>
        <div className="grid max-w-96 gap-8 self-center text-center">
          <div>
            <p className="mb-2 font-bold">Card translations</p>
            <p>
              <CreditsItem
                name="Team TBOI Four Souls Latinoamérica"
                image="/TBOIFSLATAM.png"
                link="https://discord.gg/DrKKMuEWdQ"
              />
              Sirczen, Arzu, Demian, Dontor, Flare, Jörmant, JRaider, Malataka,
              Mello Wagon, Misaraya, mrwetcoat and Yibril
            </p>
          </div>
          <div>
            <p className="mb-2 font-bold">UI translations</p>
            <p>SircZen, Mello Wagon and Jörmant</p>
          </div>
        </div>
        <h3 className="mt-8 text-center font-main text-2xl font-bold">
          French translation
        </h3>
        <div className="grid max-w-96 gap-8 self-center text-center">
          <div>
            <p className="mb-2 font-bold">Card translations</p>
            <p>
              Localization by Funforge.
              <br />
              Digitize and proofread by Fabby29
            </p>
          </div>
          <div>
            <p className="mb-2 font-bold">UI translations</p>
            <p>Sylvain Lichau</p>
          </div>
        </div>
        <h3 className="mt-8 text-center font-main text-2xl font-bold">
          Special thanks
        </h3>
        <p className="max-w-96 self-center text-center">
          We would we like to thank <strong>Yuggy</strong> for taking the time
          to answer our many questions.
        </p>
        <p className="max-w-96 self-center text-center">
          Thank you to the <strong>Dev Team</strong> of{" "}
          <a
            href="https://foursouls.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-space-100 underline">
            foursouls.com
          </a>{" "}
          for keeping a digital record of all the cards and their
          characteristics.
        </p>
      </div>
    </>
  );
};

interface CreditsItemProps {
  name: string;
  image: string;
  link?: string;
}

const CreditsItem = ({ name, image, link }: CreditsItemProps) => {
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
    </li>
  );
};
