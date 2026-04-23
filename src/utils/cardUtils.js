export function getVariants(card, setFilter = "master") {
//export function getVariants(card, userCards = {}, setFilter) {
    const rarity = (card.rarity || "").toLowerCase();

  if (setFilter === "standard") {
    return rarity === "rare" ? ["holo"] : ["normal"];
  }

  if (setFilter === "parallel") {
    return rarity === "rare"
      ? ["holo", "reverse"]
      : ["normal", "reverse"];
  }

  return rarity === "rare"
    ? ["holo", "reverse"]
    : ["normal", "reverse"];
}

//export function getCardStats(card, userCards, setFilter) {
export function getCardStats(card, userCards = {} , setFilter) {
  const variants = getVariants(card, setFilter);

  let owned = 0;

  variants.forEach(v => {
    const key = `${card.id}_${v}`;
    //if ((userCards[key]?.total || 0) > 0) owned++;
    if ((userCards[`${card.id}_${v}`] || 0) > 0) owned++;
  });

  return {
    isComplete: owned === variants.length,
    isPartial: owned > 0 && owned < variants.length,
    isMissing: owned === 0
  };
}
