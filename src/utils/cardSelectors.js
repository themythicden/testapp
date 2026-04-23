export function getVisibleCards({
  cards,
  userCards,
  collection,
  setFilter,
  statusFilter,
}) {
  return cards.filter(card => {
    const stats = getCardStats(card, userCards, setFilter);
    const isSecret = isSecretCard(card, collection.rule);

    // -------------------------
    // 1. SET FILTER LOGIC
    // -------------------------
    if (setFilter === "standard" && isSecret) return false;
    if (setFilter === "parallel" && isSecret) return false;
    // master = show everything

    // -------------------------
    // 2. STATUS FILTER LOGIC
    // -------------------------
    switch (statusFilter) {
      case "owned":
        return stats.isComplete;

      case "needed":
        return stats.isMissing;

      case "duplicates":
        return getVariants(card, setFilter).some(v => {
          const key = `${card.id}_${v}`;
          return (userCards[key]?.total || 0) > 1;
        });

      default:
        return true;
    }
  });
}
