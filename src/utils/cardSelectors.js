//import { getVariants } from "./cardUtils";
//import { isSecretCard } from "./setUtils";
import { getCardStats, getVariants } from "./cardUtils";
import { isSecretCard } from "./setUtils";

export function getVisibleCards({
  cards,
  userCards,
  setFilter,
  statusFilter,
  collection
}) {
  if (!collection) return [];

  return cards.filter(card => {
    const stats = getCardStats(card, userCards, setFilter, collection);
    const isSecret = isSecretCard(card, collection.rule);

    // ❗ SECRET LOGIC
    if (setFilter !== "master" && isSecret) return false;

    // -----------------------------
    // STATUS FILTER
    // -----------------------------
    switch (statusFilter) {
      case "owned":
        return stats.isComplete;

      case "needed":
        return stats.isMissing;

      case "duplicates":
        return getVariants(card, setFilter).some(v => {
          const key = `${card.id}_${v}`;
          return (userCards[key] || 0) > 1;
        });

      default:
        return true;
    }
  });
}
