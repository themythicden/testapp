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
  isCollab
}) {
  const allVariants = getVariants(card, setFilter);

  const variants =
    statusFilter === "needed"
      ? allVariants.filter(v => {
          const key = `${card.id}_${v}`;
          return (userCards[key] || 0) === 0;
        })
      : allVariants;

  const stats = getCardStats(card, userCards, setFilter);

  const handleAdd = (variant) => onAdd(card.id, variant);
  const handleRemove = (variant) => onRemove(card.id, variant);

  let statusText = <span className="text-red-400">Need</span>;
  if (stats.isComplete)
    statusText = <span className="text-green-400">Owned</span>;
  else if (stats.isPartial)
    statusText = <span className="text-yellow-400">Partial</span>;

  const saturation = stats.isMissing ? "grayscale opacity-60" : "";

  return (
    <div className="bg-gray-700 p-2 rounded">
      <div className="text-center">
        <p className="text-xl font-bold bg-gray-800 p-2">
          {card.name}
        </p>

        <p className="text-sm font-bold bg-black p-1">
          #{card.number}
        </p>
      </div>

      <div className="mt-2 text-center">{statusText}</div>

      <img
        src={card.image_small || card.image_large}
        alt={card.name}
        className={`h-40 mx-auto mt-2 ${saturation}`}
      />

      <div className="bg-gray-800 mt-2 p-2 space-y-3">
        {variants.map(v => {
          const myKey = `${card.id}_${v}`;
          const myCount = userCards[myKey] || 0;

          const total = collectionUsers.reduce((sum, user) => {
            const key = `${user.email}_${card.id}_${v}`;
            return sum + (allUserCards[key] || 0);
          }, 0);

          return (
            <div key={v} className="border border-gray-700 rounded p-2">
              <VariantRow
                variant={v}
                count={myCount}
                onAdd={handleAdd}
                onRemove={handleRemove}
              />

              {isCollab && (
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
                            : user.email}
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
