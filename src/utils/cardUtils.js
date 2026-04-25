import { SET_CONFIG } from "./setConfig";

export function getVariants(card, setView = "master") {
  const config = SET_CONFIG[card.set_code];
  const base = config.standard;
  //console.log("SET_CONFIG: " , base);
  //console.log("CONFIG: ", config.standard);
  if (!config) return ["normal"];

  const st = card.supertype;
  const rarity = (card.rarity || "").toLowerCase();
  const supertype = (card.supertype || "").toLowerCase();
  const number = card.number;
  
  //console.log("CARD: " + number+" "+st);
  let group = "default";

  if (supertype === "trainer") {
      if (rarity === "ace spec rare") {
          group = "ace_spec";
      } else if (number > base) {
          group = "fa_trainer";
      } else {
          group = "trainer";
      }
  }
  else if (rarity === "common") group = "common";
  else if (rarity === "uncommon") group = "uncommon";
  else if (rarity === "rare") group = "rare";

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
