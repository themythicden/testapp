import { SET_CONFIG } from "../setConfig";

export function getVariants(card, setFilter = "master") {
  const setCode = card.set_code;
  const config = SET_CONFIG[setCode];

  if (!config) return ["normal"]; // fallback

  const rarity = (card.rarity || "").toLowerCase();
  const supertype = (card.supertype || "").toLowerCase();

  // determine variant group
  let variantGroup = "default";

  if (supertype === "trainer") {
    variantGroup = "trainer";
  } else if (rarity.includes("common")) {
    variantGroup = "common";
  } else if (rarity.includes("uncommon")) {
    variantGroup = "uncommon";
  } else if (rarity.includes("rare")) {
    variantGroup = "rare";
  }

  const variants =
    config.variants[variantGroup] ||
    config.variants.default ||
    ["normal"];

  // -----------------------------
  // FILTER BY SET TYPE
  // -----------------------------
  if (setFilter === "standard") {
    return variants.filter(v => v === "normal" || v === "holo");
  }

  if (setFilter === "parallel") {
    return variants.filter(v => v !== "masterball"); // example rule
  }

  return variants; // master
}

//export function getCardStats(card, userCards, setFilter) {
export function getCardStats(card, userCards = {}, setFilter) {
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
