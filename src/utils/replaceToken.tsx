import React from "react";

type Replacement = readonly [key: string, node: React.ReactNode];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function replaceTokens(
  text: string,
  replacements: readonly Replacement[],
): React.ReactNode[] {
  if (replacements.length === 0) return [text];

  const keys = replacements
    .map(([key]) => escapeRegExp(key))
    .sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${keys.join("|")})`, "g");
  const map = new Map(replacements);

  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part, index) =>
      map.has(part) ? (
        <React.Fragment key={index}>{map.get(part)}</React.Fragment>
      ) : (
        part
      ),
    );
}
