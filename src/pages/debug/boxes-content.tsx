import cards from "@/data/boxes.json";
import { CardImage } from "@/components/board/card";
import { useState } from "react";

const colors = ["#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF", "#000", "#FFF"];

export const BoxesContent = () => {
  const boxCount = Object.values(cards).map((boxes) => boxes.length);

  const minBox = Math.min(...boxCount);
  const maxBox = Math.max(...boxCount);

  const [current, setCurrent] = useState(minBox);

  const filteredCards = Object.entries(cards).filter(
    ([_, boxes]) => boxes.length >= current,
  );

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <p>Showing cards with at least {current} boxes</p>
      <input
        type="range"
        min={minBox}
        max={maxBox}
        value={current}
        onChange={(event) => setCurrent(parseInt(event.target.value))}
      />
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {filteredCards.map(([slug, boxes]) => (
          <div style={{ position: "relative" }}>
            <CardImage
              sizes="180px"
              card={{ slug }}
              style={{ height: "100%", width: "100%" }}
            />
            {boxes.map((box, index) => (
              <div
                style={{
                  top: box.top * 100 + "%",
                  left: box.left * 100 + "%",
                  right: box.right * 100 + "%",
                  bottom: box.bottom * 100 + "%",
                  position: "absolute",
                  backgroundColor: colors[index],
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
