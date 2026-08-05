import { SET_CONFIG } from "./setConfig";

export function getVariants(card, setView = "master") {
  const config = SET_CONFIG[card.set_code];

  if (!config) return ["normal"];

const base = Number(config.standard || 0);
const rarity = String(card.rarity || "").trim().toLowerCase();
const supertype = String(card.supertype || "").trim().toLowerCase();

const subtypes = Array.isArray(card.subtypes)
  ? card.subtypes.map(subtype =>
      String(subtype || "").trim().toLowerCase()
    )
  : String(card.subtypes || "")
      .split(",")
      .map(subtype => subtype.trim().toLowerCase())
      .filter(Boolean);

const number = Number(card.number);

let group = "default";

if (supertype === "trainer") {
  if (rarity === "ace spec rare") {
    group = "ace_spec";
  } else if (number > base) {
    group = "fa_trainer";
  } else if (subtypes.includes("item")) {
    group = "item";
  }  else if (subtypes.includes("special")) {
    group = "special";
  } else {
    group = "trainer";
  }
} else if (rarity === "common") {
  group = "common";
} else if (rarity === "uncommon") {
  group = "uncommon";
} else if (rarity === "rare") {
  group = "rare";
} else if (rarity === "rare holo") {
  group = "rare_holo";
}
  

  const variants =
    config.variants[group] ||
    config.variants.default ||
    ["normal"];

  const view = config.views?.[setView];

  if (!view || view === "all") return variants;

  return variants.filter(v => view.includes(v));
}

export function getCardStats(
  card,
  userCards = {},
  setFilter,
  options = {}
) {
  const variants = getVariants(card, setFilter);

  let owned = 0;

  variants.forEach(v => {
    let count = 0;

    if (options.getOwnedCount) {
      count = options.getOwnedCount(v);
    } else {
      const key = `${card.id}_${v}`;
      count = userCards[key] || 0;
    }

    if (count > 0) owned++;
  });

  return {
    isComplete: owned === variants.length,
    isPartial: owned > 0 && owned < variants.length,
    isMissing: owned === 0
  };
}
