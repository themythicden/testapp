import { SET_CONFIG } from "./setConfig";

export function getVariants(card, setView = "master") {
  const config = SET_CONFIG[card.set_code];
  if (!config) return ["normal"];

  const rarity = (card.rarity || "").toLowerCase();
  const supertype = (card.supertype || "").toLowerCase();

  let group = "default";

  if (supertype === "trainer") group = "trainer";
  else if (rarity.includes("common")) group = "common";
  else if (rarity.includes("uncommon")) group = "uncommon";
  else if (rarity.includes("rare")) group = "rare";

  let variants =
    config.variants[group] ||
    config.variants.default ||
    ["normal"];

  // -----------------------------
  // APPLY VIEW FILTER
  // -----------------------------
  const allowed = config.views[setView];

  if (allowed === "all") return variants;

  return variants.filter(v => allowed.includes(v));
}
