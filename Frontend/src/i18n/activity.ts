/** Translate server enum values at the display boundary; preserve unknown audit identifiers. */
export function translateActivityValue(value: string, kind: "action" | "entity", t: (key: string) => string) {
  const key = `activity_${kind}_${value.toLowerCase()}`;
  const result = t(key);
  return result === key ? value.replaceAll("_", " ") : result;
}
