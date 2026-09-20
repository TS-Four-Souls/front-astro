import { extensionsAvailable, type DeckConfigCard } from "@/shared/api";
import { cn } from "@/utils/cn";
import { HotkeyScope } from "@/utils/hotkey";
import { socket } from "@/utils/socket";
import { useMemo, useState } from "react";
import { CardImage, CardType } from "../board/card";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";
import { Popup } from "../popup";
import { useLanguageContext } from "../contexts/language-context";
import { cardJsonContentForAdvancedSearch } from "@/utils/cardsJsonForSearch";
import { SetIcon } from "@/icons/set-icon";
import { type Room } from "@/shared/api";
import type { TranslationKeys } from "translations";
import { Selector } from "../selector";
import { PlayerRestriction } from "@/icons/player-restriction";

export type DeckTypes =
  | "monster"
  | "treasure"
  | "loot"
  | "bsoul"
  | "room"
  | "character";

const tagDict: Record<string, TranslationKeys> = {
  treasure: "startStep.gameParams.decks.treasure",
  ptreasure: "tags.passive",
  atreasure: "tags.active",
  paidtreasure: "tags.paid",
  otreasure: "tags.destroy",
  streasure: "tags.soul",
  guppy: "tags.guppy",
  eternal: "common.eternal",
  trinket: "tags.trinket",
  bsoul: "startStep.gameParams.decks.bsoul",
  bevent: "tags.badevent",
  gevent: "tags.goodevent",
  boss: "tags.boss",
  epic: "tags.epicboss",
  curse: "tags.curse",
  indomitable: "tags.indomitable",
  hmonster: "tags.goodmonster",
  cmonster: "tags.cursedmonster",
  bmonster: "tags.basicmonster",
  loot: "startStep.gameParams.decks.loot",
  character: "startStep.gameParams.decks.character",
  monster: "startStep.gameParams.decks.monster",
  room: "startStep.gameParams.decks.room",
};
interface DeckConfigPopupProps {
  type: DeckTypes;
  cards: DeckConfigCard[];
  onClose: () => void;
  editable: boolean;
  gameParameters: Room["gameParameters"];
}

export const DeckConfigPopup = ({
  type,
  cards,
  onClose,
  editable,
  gameParameters,
}: DeckConfigPopupProps) => {
  const { ts, t, translateError } = useLanguageContext();

  const deckTypeLabels: Record<DeckTypes, string> = {
    monster: t("startStep.gameParams.decks.monster"),
    treasure: t("startStep.gameParams.decks.treasure"),
    character: t("startStep.gameParams.decks.character"),
    loot: t("startStep.gameParams.decks.loot"),
    bsoul: t("startStep.gameParams.decks.bsoul"),
    room: t("startStep.gameParams.decks.room"),
  };
  const { toast } = useToastContext();

  const canUseLookup = useMemo(() => {
    return cards.length > 10;
  }, [cards]);

  const [search, setSearch] = useState<string>("");
  const [soulFilter, setSoulFilter] = useState<number | undefined>();
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  type ExtensionName = keyof typeof extensionsAvailable;
  type CustomFilterName = "minimumPlayers: 3";
  const [extensionFilters, setExtensionFilters] = useState<
    Record<ExtensionName, boolean>
  >(
    () =>
      Object.fromEntries(
        Object.keys(extensionsAvailable).map((extension) => [extension, false]),
      ) as Record<ExtensionName, boolean>,
  );
  const [customFilters, setCustomFilters] = useState<
    Record<CustomFilterName, boolean>
  >({ "minimumPlayers: 3": false });

  const switchExtensionFilter = (extension: ExtensionName) => {
    setExtensionFilters((currentFilters) => ({
      ...currentFilters,
      [extension]: !currentFilters[extension],
    }));
  };

  const switchCustomFilter = (filter: CustomFilterName) => {
    setCustomFilters((currentFilters) => ({
      ...currentFilters,
      [filter]: !currentFilters[filter],
    }));
  };

  const filteredCards = useMemo(() => {
    const searchCleaned = search.trim().toLowerCase();

    const selectedExtensions = (
      Object.keys(extensionsAvailable) as ExtensionName[]
    ).filter((extension) => extensionFilters[extension]);
    const selectedCustomFilters = Object.keys(customFilters).filter(
      (filter) => customFilters[filter as CustomFilterName],
    );

    return cards.filter((option) => {
      let payload =
        option.slug === "random"
          ? ""
          : ts(option.nameKey) + cardJsonContentForAdvancedSearch[option.slug];
      if (
        "eternal" in option &&
        typeof option.eternal === "string" &&
        option.eternal !== "random"
      ) {
        payload +=
          ts({ key: "cardNames." + option.eternal }) +
          cardJsonContentForAdvancedSearch[option.eternal];
      }

      const matchesExtension =
        selectedExtensions.length === 0 ||
        selectedExtensions.some((extension) =>
          option.slug.startsWith(extension),
        );
      const matchesCustomFilter =
        selectedCustomFilters.length === 0 ||
        selectedCustomFilters.every((filter) => payload.includes(filter));
      const matchesSoulFilter =
        soulFilter === undefined ||
        (soulFilter === 0
          ? !payload.includes("soul:")
          : new RegExp(`soul: ${soulFilter}`).test(payload));
      const matchesTagFilter =
        tagFilter === undefined || payload.includes(`:${tagFilter}`);
      const matchesOtherFilters =
        matchesExtension &&
        matchesCustomFilter &&
        matchesSoulFilter &&
        matchesTagFilter;

      if (
        !matchesOtherFilters ||
        search.trim().length === 0 ||
        !searchCleaned
      ) {
        return matchesOtherFilters;
      }
      return JSON.stringify(payload).toLowerCase().includes(searchCleaned);
    });
  }, [
    cards,
    customFilters,
    extensionFilters,
    search,
    soulFilter,
    tagFilter,
    ts,
  ]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const card of cards) {
      let payload =
        card.slug === "random"
          ? ""
          : ts(card.nameKey) + cardJsonContentForAdvancedSearch[card.slug];
      if (
        "eternal" in card &&
        typeof card.eternal === "string" &&
        card.eternal !== "random"
      ) {
        payload +=
          ts({ key: "cardNames." + card.eternal }) +
          cardJsonContentForAdvancedSearch[card.eternal];
      }
      for (const tag of payload.matchAll(/:[a-z][a-z]+\b/g)) {
        if ("roll".includes(tag[0].slice(1))) continue;
        if ("all".includes(tag[0].slice(1))) continue;
        tags.add(tag[0].slice(1));
      }
    }
    if (tagFilter !== undefined) tags.add(tagFilter);
    return [...tags];
  }, [cards, tagFilter, ts]);
  function onModifyAll(toAdd: number) {
    return () => {
      socket.emit(
        "setGameParameter",
        {
          parameter: "decksConfig",
          value: {
            [type]: filteredCards.map((c) => {
              return { ...c, count: c.count + toAdd };
            }),
          },
        },
        (response) => {
          if (response.status === 400)
            toast(
              "error",
              t("startStep.gameParams.inputs.cardCount.errorToast.title"),
              translateError(response.error),
            );
        },
      );
    };
  }
  const onCardCountChange = (card: DeckConfigCard, count: number) => {
    socket.emit(
      "setGameParameter",
      {
        parameter: "decksConfig",
        value: {
          [type]: [
            {
              ...card,
              count,
            },
          ],
        },
      },
      (response) => {
        if (response.status === 400)
          toast(
            "error",
            t("startStep.gameParams.inputs.cardCount.errorToast.title"),
            translateError(response.error),
          );
      },
    );
  };

  return (
    <Popup
      onPressBackdrop={onClose}
      className={cn(canUseLookup && "h-full w-full")}>
      <div className="flex flex-row items-start justify-between gap-8">
        <div className="flex items-center gap-6">
          <h1 className="font-main text-2xl leading-tight font-bold uppercase">
            {deckTypeLabels[type]}
          </h1>
          <div className="flex h-full items-center">
            <Button
              onClick={onModifyAll(-1)}
              label="−"
              className="rounded-r-none font-sans"
            />
            <div className="flex h-10 items-center border-y-2 border-taupe-600 px-4 text-center font-sans font-bold">
              All
            </div>
            <Button
              onClick={onModifyAll(1)}
              label="+"
              className="rounded-l-none font-sans"
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex flex-wrap gap-2">
            {gameParameters.decksConfig.useB2Cards && (
              <Button
                onClick={() => switchExtensionFilter("b2-")}
                label={<SetIcon set="b2" className="size-5" />}
                active={extensionFilters["b2-"]}
              />
            )}
            {gameParameters.decksConfig.useFSP2Cards && (
              <Button
                onClick={() => switchExtensionFilter("fsp2-")}
                label={<SetIcon set="fsp2" className="size-5" />}
                active={extensionFilters["fsp2-"]}
              />
            )}
            {gameParameters.decksConfig.useG2Cards && (
              <Button
                onClick={() => switchExtensionFilter("g2-")}
                label={<SetIcon set="g2" className="size-5" />}
                active={extensionFilters["g2-"]}
              />
            )}
            {gameParameters.decksConfig.useRCards && (
              <Button
                onClick={() => switchExtensionFilter("r-")}
                label={<SetIcon set="r" className="size-5" />}
                active={extensionFilters["r-"]}
              />
            )}
            <div className="mx-1" />
            <Button
              onClick={() => switchCustomFilter("minimumPlayers: 3")}
              label={<PlayerRestriction className="size-5" />}
              active={customFilters["minimumPlayers: 3"]}
            />
            <div className="mx-1" />
            <Selector
              options={[0, 1, 2]}
              ItemComponent={({ option, active }) =>
                option === 0 ? (
                  0
                ) : (
                  <img
                    src={`/ui/soul-${option}.png`}
                    className={cn(
                      "size-6",
                      active && "drop-shadow-sm drop-shadow-taupe-950",
                    )}
                  />
                )
              }
              value={soulFilter}
              onChange={(value) => setSoulFilter(value)}
              onRemove={() => setSoulFilter(undefined)}
            />
            <div className="mx-1" />
            <select
              aria-label="Tag filter"
              className="max-w-40 rounded-md border-2 border-taupe-500 bg-taupe-600 px-3 py-2 font-main text-white uppercase"
              value={tagFilter ?? ""}
              onChange={(event) =>
                setTagFilter(
                  event.target.value === "" ? undefined : event.target.value,
                )
              }>
              {/* <option value="">Tag: all</option> */}
              {availableTags.map((tag) => (
                <option value={tag} key={tag}>
                  {tagDict[tag] === undefined ? tag : ts({ key: tagDict[tag] })}
                </option>
              ))}
            </select>
            <div className="mx-1" />
            {canUseLookup && (
              <input
                className="w-48 rounded-md border-2 border-taupe-500 px-4"
                placeholder={t("common.popup.search.placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>
          <Button
            onClick={onClose}
            hotkey="escape"
            hotkeyScope={[HotkeyScope.Popup]}
            label={t("common.closeButton")}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex grow flex-wrap content-start justify-center gap-x-6 gap-y-12 overflow-auto p-4",
          filteredCards.some((card) => "eternal" in card) && "gap-x-16",
        )}>
        {filteredCards.map((card) => (
          <div className="flex flex-col items-center gap-4" key={card.slug}>
            <div
              className={cn(
                "flex flex-row items-center gap-2",
                card.count === 0 && "brightness-50 contrast-90",
              )}>
              <CardImage
                card={{ slug: card.slug }}
                sizes={card.orientation === "portrait" ? "12em" : "24em"}
                className={
                  card.orientation === "portrait"
                    ? "w-48 shadow-lg/30"
                    : "w-76 shadow-lg/30"
                }
                orientation={card.orientation}
              />
              {"eternal" in card && (
                <>
                  {card.eternal === "random" ? (
                    <div className="grid items-center gap-2">
                      <CardImage
                        card={CardType.CharacterCard}
                        sizes="12em"
                        className="col-start-1 row-start-1 w-48 shadow-lg/30"
                      />
                      <p className="col-start-1 row-start-1 text-center font-main text-[800%] font-bold text-black uppercase text-shadow-amber-50 text-shadow-lg">
                        ?
                      </p>
                    </div>
                  ) : (
                    <CardImage
                      card={{ slug: card.eternal }}
                      sizes="12em"
                      className="w-48 shadow-lg/30"
                    />
                  )}
                </>
              )}
            </div>
            <div className={cn("flex w-full", "eternal" in card && "w-1/2")}>
              <Button
                onClick={() => onCardCountChange(card, card.count - 1)}
                label={t("startStep.gameParams.inputs.numeric.decreaseButton")}
                className="rounded-r-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.title",
                  ),
                  content: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.message",
                  ),
                  enabled: !editable,
                }}
              />
              <p className="flex h-10 min-w-13 grow items-center justify-center border-y-2 border-taupe-600 text-center font-bold">
                {card.count}
              </p>
              <Button
                onClick={() => onCardCountChange(card, card.count + 1)}
                label={t("startStep.gameParams.inputs.numeric.increaseButton")}
                className="rounded-l-none font-sans shadow-none"
                disabled={!editable}
                tooltip={{
                  title: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.title",
                  ),
                  content: t(
                    "startStep.gameParams.inputs.cardCount.nonHostTooltip.message",
                  ),
                  enabled: !editable,
                }}
              />
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className="flex h-full w-full items-center justify-center text-center text-lg text-taupe-400">
            {t("startStep.gameParams.inputs.cardCount.emptyResults")}
          </div>
        )}
      </div>
    </Popup>
  );
};
