import { useState } from "react";
import { botLevelSchema, type BotLevel, type RoomPlayer } from "@/shared/api";
import { socket } from "@/utils/socket";
import { useLanguageContext } from "../contexts/language-context";
import { useToastContext } from "../board/contexts/toast-context";
import { Button } from "../button";

const labels = {
  en: {
    add: "Add bot",
    bot: "Bot",
    difficulty: "Bot difficulty",
    remove: "Remove bot",
    error: "Could not configure bot",
    easy: "Easy",
    normal: "Normal",
    hard: "Hard",
  },
  fr: {
    add: "Ajouter un bot",
    bot: "Bot",
    difficulty: "Difficulté du bot",
    remove: "Retirer le bot",
    error: "Impossible de configurer le bot",
    easy: "Facile",
    normal: "Normal",
    hard: "Difficile",
  },
};

function LevelSelect({
  level,
  onChange,
}: {
  level: BotLevel;
  onChange: (level: BotLevel) => void;
}) {
  const { language } = useLanguageContext();
  const text = labels[language === "fr" ? "fr" : "en"];
  return (
    <label className="flex flex-col gap-1 text-sm">
      {text.difficulty}
      <select
        className="rounded border border-space-400 bg-space p-1"
        value={level}
        onChange={(event) =>
          onChange(botLevelSchema.parse(event.target.value))
        }>
        {botLevelSchema.options.map((value) => (
          <option key={value} value={value}>
            {text[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AddBotControl() {
  const [level, setLevel] = useState<BotLevel>("normal");
  const { language, translateError } = useLanguageContext();
  const { toast } = useToastContext();
  const text = labels[language === "fr" ? "fr" : "en"];
  return (
    <div className="flex flex-col gap-2">
      <LevelSelect level={level} onChange={setLevel} />
      <Button
        theme="onSpace"
        label={text.add}
        onClick={() =>
          socket.emit("addBot", { level }, (response) => {
            if (response.status === 400)
              toast("error", text.error, translateError(response.error));
          })
        }
      />
    </div>
  );
}

export function BotControls({
  bot,
  canConfigure,
}: {
  bot: NonNullable<RoomPlayer["bot"]>;
  canConfigure: boolean;
}) {
  const { language, translateError } = useLanguageContext();
  const { toast } = useToastContext();
  const text = labels[language === "fr" ? "fr" : "en"];
  return (
    <div className="mt-2 flex w-32 flex-col gap-2">
      <span className="text-center text-sm font-bold">
        {text.bot} · {text[bot.level]}
      </span>
      {canConfigure && (
        <>
          <LevelSelect
            level={bot.level}
            onChange={(level) =>
              socket.emit("setBotLevel", { id: bot.id, level }, (response) => {
                if (response.status === 400)
                  toast("error", text.error, translateError(response.error));
              })
            }
          />
          <Button
            theme="onSpace"
            label={text.remove}
            onClick={() =>
              socket.emit("removeBot", { id: bot.id }, (response) => {
                if (response.status === 400)
                  toast("error", text.error, translateError(response.error));
              })
            }
          />
        </>
      )}
    </div>
  );
}
