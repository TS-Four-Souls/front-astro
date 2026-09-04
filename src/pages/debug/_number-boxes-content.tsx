import { CardImage, CardTextMarker } from "@/components/board/card";
import { useLanguageContext } from "@/components/contexts/language-context";
import { numberBoxCardSlugs, resolveNumberBoxes } from "@/utils/number-boxes";
import { useState } from "react";

export const NumberBoxesContent = () => {
  const { language } = useLanguageContext();
  const [search, setSearch] = useState("");
  const cards = numberBoxCardSlugs
    .filter((slug) => slug.includes(search.trim().toLowerCase()))
    .map((slug) => ({ slug, resolved: resolveNumberBoxes(slug, language)! }));

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search card slug"
        className="rounded-md border-2 px-3 py-2"
      />
      <p>
        Showing {cards.length} cards and{" "}
        {cards.reduce((count, card) => count + card.resolved.boxes.length, 0)}{" "}
        numbers
      </p>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {cards.map(({ slug, resolved }) => (
          <div key={slug} className="relative">
            <CardImage
              sizes="180px"
              card={{ slug }}
              language={resolved.language}
              style={{ height: "100%", width: "100%" }}
            />
            {resolved.boxes.map((box, occurrenceIndex) => (
              <CardTextMarker key={occurrenceIndex} bounds={box}>
                <div
                  title={`${occurrenceIndex}: ${box.value}`}
                  className="h-full w-full rounded-[0.3em] border-2 border-red-500 bg-red-400/30"
                />
              </CardTextMarker>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
