import { getCardStats, getVariants } from "./cardUtils";
import { isSecretCard } from "./setUtils";

export function getVisibleCards({
  cards,
  userCards,
  allUserCards = {},
  collectionUsers = [],
  isCollab = false,
  setFilter,
  statusFilter,
  collection,
  searchQuery,
  sortBy,
  typeFilter = [],
  supertypeFilter = [],
  legalOnly = false
}) {
  if (!collection) return [];

  const getOwnedCount = (cardId, variant) => {
    if (!isCollab) {
      return userCards[`${cardId}_${variant}`] || 0;
    }

    return collectionUsers.reduce((total, collectionUser) => {
      const key = `${collectionUser.email}_${cardId}_${variant}`;
      return total + (allUserCards[key] || 0);
    }, 0);
  };

  const isCardComplete = card => {
    return getVariants(card, setFilter).every(variant => {
      return getOwnedCount(card.id, variant) > 0;
    });
  };

  let result = cards.filter(card => {
    const isSecret = isSecretCard(card, collection.rule);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      const matchesName = card.name?.toLowerCase().includes(q);
      const matchesNumber = String(card.number).includes(q);

      if (!matchesName && !matchesNumber) return false;
    }

    if (setFilter !== "master" && isSecret) return false;

    if (typeFilter.length > 0) {
      const cardTypes = card.types || [];
      const match = typeFilter.some(t => cardTypes.includes(t));
      if (!match) return false;
    }

    if (supertypeFilter.length > 0) {
      if (!supertypeFilter.includes(card.supertype)) return false;
    }

    if (legalOnly) {
      const mark = card.regulation_mark || "";
      if (mark < "G") return false;
    }

    switch (statusFilter) {
      case "owned":
        return isCardComplete(card);

      case "needed":
        return !isCardComplete(card);

      case "duplicates":
        return getVariants(card, setFilter).some(v => {
          return getOwnedCount(card.id, v) > 1;
        });

      default:
        return true;
    }
  });

  result.sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "owned") {
      const countA = getVariants(a, setFilter).reduce((sum, v) => {
        return sum + getOwnedCount(a.id, v);
      }, 0);

      const countB = getVariants(b, setFilter).reduce((sum, v) => {
        return sum + getOwnedCount(b.id, v);
      }, 0);

      return countB - countA;
    }

    return Number(a.number) - Number(b.number);
  });

  return result;
}
