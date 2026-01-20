export const tooltip = (title: string, capable: string | true) => {
  if (typeof capable === "string") {
    return `${title}:\n${capable}`;
  }
  return undefined;
};
