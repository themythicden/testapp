import { getVariants } from "./cardUtils";
import { isSecretCard } from "./setUtils";

export function getVisibleCards({
  cards,
  userCards,
  allUserCards = {},
  collectionUsers = [],
  isCollab = false,
  showMineOnly = false,
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

  const getMyOwnedCount = (cardId, variant) => {
    return userCards[`${cardId}_${variant}`] || 0;
  };

  const getCollectionOwnedCount = (cardId, variant) => {
    if (!isCollab || showMineOnly) {
      return getMyOwnedCount(cardId, variant);
    }

    return collectionUsers.reduce((sum, collectionUser) => {
      const key = `${collectionUser.email}_${cardId}_${variant}`;
      return sum + (allUserCards[key] || 0);
    }, 0);
  };

  const getActiveOwnedCount = (cardId, variant) => {
    return getCollectionOwnedCount(cardId, variant);
  };

  const isCardComplete = card => {
    const variants = getVariants(card, setFilter);

    return variants.every(variant => {
      return getActiveOwnedCount(card.id, variant) > 0;
    });
  };

  const isCardCollectedAtAll = card => {
    const variants = getVariants(card, setFilter);

    return variants.some(variant => {
      return getActiveOwnedCount(card.id, variant) > 0;
    });
  };

  const hasDuplicates = card => {
    const variants = getVariants(card, setFilter);

    return variants.some(variant => {
      return getActiveOwnedCount(card.id, variant) > 1;
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

    if (setFilter !== "master" && isSecret) {
      return false;
    }

    if (typeFilter.length > 0) {
      const cardTypes = card.types || [];
      const match = typeFilter.some(t => cardTypes.includes(t));

      if (!match) return false;
    }

    if (supertypeFilter.length > 0) {
      if (!supertypeFilter.includes(card.supertype)) {
        return false;
      }
    }

    if (legalOnly) {
      const mark = card.regulation_mark || "";

      if (mark < "G") return false;
    }

    const getActiveUsers = () => {
      if (!isCollab) return [];
    
      if (selectedOwnerEmails.length > 0) {
        return collectionUsers.filter(user =>
          selectedOwnerEmails.includes(user.email)
        );
      }
    
      return collectionUsers;
    };
    
    const getOwnedCount = (cardId, variant) => {
      if (!isCollab) {
        return userCards[`${cardId}_${variant}`] || 0;
      }
    
      return getActiveUsers().reduce((sum, collectionUser) => {
        const key = `${collectionUser.email}_${cardId}_${variant}`;
        return sum + (allUserCards[key] || 0);
      }, 0);
    };

    /*
      Important:
      - When showMineOnly is false:
        status filters use the full collection total in collab mode.
      - When showMineOnly is true:
        status filters ignore other users completely and only use userCards.
    */
    switch (statusFilter) {
      case "owned":
        return isCardComplete(card);

      case "needed":
        return !isCardComplete(card);

      case "collected":
        return isCardCollectedAtAll(card);

      case "duplicates":
        return hasDuplicates(card);

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
        return sum + getActiveOwnedCount(a.id, v);
      }, 0);

      const countB = getVariants(b, setFilter).reduce((sum, v) => {
        return sum + getActiveOwnedCount(b.id, v);
      }, 0);

      return countB - countA;
    }

    return Number(a.number) - Number(b.number);
  });

  return result;
}
