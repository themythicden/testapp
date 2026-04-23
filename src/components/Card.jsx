import React from "react";
import { getCardStats, getVariants } from "../utils/cardUtils";
import VariantRow from "./VariantRow";

function Card({ card, userData = {}, setFilter, onAdd, onRemove }) {
  const stats = getCardStats(card, userData, setFilter);
  const variants = getVariants(card, setFilter);

  const handleAdd = (variant) => onAdd(card.id, variant);
  const handleRemove = (variant) => onRemove(card.id, variant);

  return (
    <div className="bg-gray-700 p-2 rounded">
      <p className="text-xl font-bold bg-gray-800 p-2">
        {card.name}
      </p>

      <div className="bg-gray-800 mt-2 p-2 space-y-1">
        {variants.map(v => {
          const count = userData[v] || 0;

          return (
            <VariantRow
              key={v}
              variant={v}
              count={count}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Card;
