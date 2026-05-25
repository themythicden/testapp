import React from "react";
import { getCardStats, getVariants } from "../utils/cardUtils";
import VariantRow from "./VariantRow";

function Card({
  card,
  userCards,
  allUserCards = {},
  collectionUsers = [],
  setFilter,
  statusFilter,
  onAdd,
  onRemove,
  currentUserEmail,
  isCollab,
  showMineOnly
}) {
  const allVariants = getVariants(card, setFilter);

const getTotalOwnedForVariant = variant => {
  if (!isCollab || showMineOnly) {
    return userCards[`${card.id}_${variant}`] || 0;
  }

  return collectionUsers.reduce((sum, user) => {
    const key = `${user.email}_${card.id}_${variant}`;
    return sum + (allUserCards[key] || 0);
  }, 0);
};

  const getMyOwnedForVariant = variant => {
    const key = `${card.id}_${variant}`;
    return userCards[key] || 0;
  };

  const variants =
    statusFilter === "needed"
      ? allVariants.filter(v => getTotalOwnedForVariant(v) === 0)
      : allVariants;

  const stats = getCardStats(card, userCards, setFilter, {
    getOwnedCount: getTotalOwnedForVariant
  });

  const handleAdd = variant => onAdd(card.id, variant);
  const handleRemove = variant => onRemove(card.id, variant);

  let statusText = <span className="text-red-400">Need</span>;

  if (stats.isComplete) {
    statusText = <span className="text-green-400">Owned</span>;
  } else if (stats.isPartial) {
    statusText = <span className="text-yellow-400">Partial</span>;
  }

  const saturation = stats.isMissing ? "grayscale opacity-60" : "";

  return (
    <div id="cardContainer" className="bg-gray-700 rounded">
      <div className="text-center">
        <p className="text-md font-bold bg-gray-800 p-2 text-white">
          {card.name}
        </p>

        <div className="w-full flex">
          <p className="text-sm text-white font-bold bg-black p-2 w-full">
            #{card.number}
          </p>

          <div className="mt-2 text-center w-full">
            {statusText}
          </div>
        </div>
      </div>

      <img
        src={card.image_small || card.image_large}
        alt={card.name}
        className={`h-40 mx-auto mt-2 ${saturation}`}
      />

      <div className="bg-gray-800 mt-2 p-2 space-y-3">
        {variants.map(v => {
          const myCount = getMyOwnedForVariant(v);
          const total = getTotalOwnedForVariant(v);

          return (
            <div key={v} className="border border-gray-700 rounded p-2">
              <VariantRow
                variant={v}
                count={myCount}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />

              {{isCollab && !showMineOnly && ( (
                <div className="mt-2 text-xs space-y-1">
                  {collectionUsers.map(user => {
                    const key = `${user.email}_${card.id}_${v}`;
                    const count = allUserCards[key] || 0;

                    if (count === 0) return null;

                    return (
                      <div
                        key={user.email}
                        className="flex justify-between text-gray-300"
                      >
                        <span>
                          {user.email === currentUserEmail
                            ? "You"
                            : user.name || user.email.split("@")[0]}
                        </span>
                        <span>{count}</span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between text-yellow-400 font-bold border-t border-gray-600 pt-1">
                    <span>Total</span>
                    <span>{total}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(Card);
