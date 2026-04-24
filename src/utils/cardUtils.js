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

  const view = config.views?.[setView];

  if (!view || view === "all") return variants;

  return variants.filter(v => view.includes(v));
}


export function getCardStats(card, userCards = {}, setFilter, collection) {
  const variants = getVariants(card, setFilter);

  let owned = 0;

  variants.forEach(v => {
    const key = `${card.id}_${v}`;
    if ((userCards[key] || 0) > 0) owned++;
  });

  return {
    isComplete: owned === variants.length,
    isPartial: owned > 0 && owned < variants.length,
    isMissing: owned === 0
  };
}
