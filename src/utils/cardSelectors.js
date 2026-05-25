import { getVariants } from "./cardUtils";
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
  showMineOnly = false,
  legalOnly = false
}) {
  if (!collection) return [];

  console.log("======== CARD SELECTOR START ========");
  console.log("IS COLLAB:", isCollab);
  console.log("SET FILTER:", setFilter);
  console.log("STATUS FILTER:", statusFilter);
  console.log("COLLECTION USERS:", collectionUsers);
  console.log("USER_CARDS:", userCards);
  console.log("ALL_USER_CARDS:", allUserCards);
  console.log("ALL_USER_CARDS KEYS:", Object.keys(allUserCards));

  const getOwnedCount = (cardId, variant) => {
    if (!isCollab) {
      const key = `${cardId}_${variant}`;
      const count = userCards[key] || 0;

      console.log("CHECK OWNED NON-COLLAB:", {
        key,
        count
      });

      return count;
    }

    const total = collectionUsers.reduce((sum, collectionUser) => {
      const key = `${collectionUser.email}_${cardId}_${variant}`;
      const value = allUserCards[key] || 0;

      console.log("CHECK OWNED COLLAB KEY:", {
        email: collectionUser.email,
        cardId,
        variant,
        key,
        value
      });

      return sum + value;
    }, 0);

    console.log("TOTAL COLLAB OWNED COUNT:", {
      cardId,
      variant,
      total
    });

    return total;
  };

  const isCardComplete = card => {
    const variants = getVariants(card, setFilter);

    console.log("CARD VARIANTS BEING CHECKED:", {
      cardId: card.id,
      name: card.name,
      variants
    });

    const complete = variants.every(variant => {
      const ownedCount = getOwnedCount(card.id, variant);

      console.log("VARIANT COMPLETE CHECK:", {
        cardId: card.id,
        name: card.name,
        variant,
        ownedCount,
        isOwned: ownedCount > 0
      });

      return ownedCount > 0;
    });

    console.log("CARD COMPLETE RESULT:", {
      cardId: card.id,
      name: card.name,
      complete
    });

    return complete;
  };

  let result = cards.filter(card => {
    const isSecret = isSecretCard(card, collection.rule);

    console.log("======== CHECK CARD ========");
    console.log("CARD:", {
      id: card.id,
      name: card.name,
      number: card.number,
      types: card.types,
      supertype: card.supertype,
      regulation_mark: card.regulation_mark,
      isSecret
    });

    if (showMineOnly) {
      const mineOwned = getVariants(card, setFilter).some(v => {
        const key = `${card.id}_${v}`;
        return (userCards[key] || 0) > 0;
      });
    
      if (!mineOwned) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      const matchesName = card.name?.toLowerCase().includes(q);
      const matchesNumber = String(card.number).includes(q);

      console.log("SEARCH CHECK:", {
        query: q,
        matchesName,
        matchesNumber
      });

      if (!matchesName && !matchesNumber) return false;
    }

    if (setFilter !== "master" && isSecret) {
      console.log("FILTERED OUT BY SET FILTER / SECRET CARD");
      return false;
    }

    if (typeFilter.length > 0) {
      const cardTypes = card.types || [];
      const match = typeFilter.some(t => cardTypes.includes(t));

      console.log("TYPE FILTER CHECK:", {
        typeFilter,
        cardTypes,
        match
      });

      if (!match) return false;
    }

    if (supertypeFilter.length > 0) {
      const match = supertypeFilter.includes(card.supertype);

      console.log("SUPERTYPE FILTER CHECK:", {
        supertypeFilter,
        cardSupertype: card.supertype,
        match
      });

      if (!match) return false;
    }

    if (legalOnly) {
      const mark = card.regulation_mark || "";
      const legal = mark >= "G";

      console.log("LEGAL CHECK:", {
        mark,
        legal
      });

      if (!legal) return false;
    }

    switch (statusFilter) {
      case "owned": {
        const complete = isCardComplete(card);

        console.log("STATUS OWNED CHECK:", {
          cardId: card.id,
          name: card.name,
          complete
        });

        return complete;
      }

      case "needed": {
        const complete = isCardComplete(card);

        console.log("STATUS NEEDED CHECK:", {
          cardId: card.id,
          name: card.name,
          complete,
          needed: !complete
        });

        return !complete;
      }

      case "duplicates": {
        const hasDuplicate = getVariants(card, setFilter).some(v => {
          const count = getOwnedCount(card.id, v);

          console.log("DUPLICATE CHECK:", {
            cardId: card.id,
            name: card.name,
            variant: v,
            count
          });

          return count > 1;
        });

        return hasDuplicate;
      }

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

      console.log("SORT OWNED CHECK:", {
        cardA: a.name,
        countA,
        cardB: b.name,
        countB
      });

      return countB - countA;
    }

    return Number(a.number) - Number(b.number);
  });

  console.log("======== CARD SELECTOR END ========");
  console.log("RESULT COUNT:", result.length);
  console.log("RESULT FIRST 10:", result.slice(0, 10));

  return result;
}
