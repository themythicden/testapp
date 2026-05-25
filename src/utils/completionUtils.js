import { getVariants } from "./cardUtils";
import { isSecretCard } from "./setUtils";

export function getCollectionCompletion({
  cards = [],
  userCards = {},
  allUserCards = {},
  collectionUsers = [],
  selectedOwnerEmails = [],
  isCollab = false,
  setFilter,
  collection
}) {
  if (!collection) {
    return {
      owned: 0,
      total: 0,
      percentage: 0
    };
  }

  const getOwnedCount = (cardId, variant) => {
    if (!isCollab) {
      return userCards[`${cardId}_${variant}`] || 0;
    }

    return selectedOwnerEmails.reduce((sum, email) => {
      const key = `${email}_${cardId}_${variant}`;
      return sum + (allUserCards[key] || 0);
    }, 0);
  };

  let owned = 0;
  let total = 0;

  cards.forEach(card => {
    const isSecret = isSecretCard(card, collection.rule);

    if (setFilter !== "master" && isSecret) {
      return;
    }

    const variants = getVariants(card, setFilter);

    variants.forEach(variant => {
      total++;

      if (getOwnedCount(card.id, variant) > 0) {
        owned++;
      }
    });
  });

  const percentage = total === 0 ? 0 : Math.round((owned / total) * 1000) / 10;

  return {
    owned,
    total,
    percentage
  };
}
