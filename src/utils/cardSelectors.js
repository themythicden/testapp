//import { getVariants } from "./cardUtils";
//import { isSecretCard } from "./setUtils";
import { getCardStats, getVariants } from "./cardUtils";
import { isSecretCard } from "./setUtils";

export function getVisibleCards({
  cards,
  userCards,
  setFilter,
  statusFilter,
  collection,
  typeFilter = [],
  supertypeFilter = [],
  legalOnly = false
}) {
  if (!collection) return [];

  return cards.filter(card => {
    const stats = getCardStats(card, userCards, setFilter);
    const isSecret = isSecretCard(card, collection.rule);

    // -----------------------------
    // SET FILTER
    // -----------------------------
    if (setFilter !== "master" && isSecret) return false;

    // -----------------------------
    // TYPE FILTER (multi-select)
    // -----------------------------
    if (typeFilter.length > 0) {
      const cardTypes = card.types || [];
      const match = typeFilter.some(t => cardTypes.includes(t));
      if (!match) return false;
    }

    // -----------------------------
    // SUPERTYPE FILTER
    // -----------------------------
    if (supertypeFilter.length > 0) {
      if (!supertypeFilter.includes(card.supertype)) return false;
    }

    // -----------------------------
    // LEGAL FILTER
    // -----------------------------
    if (legalOnly) {
      const mark = card.regulation_mark || "";
      if (mark < "G") return false; // simple alphabetical compare
    }

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
