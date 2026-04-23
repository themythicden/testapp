import React from "react";

function VariantRow({ cardId, variant, count, onAdd, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-gray-600 p-2 rounded">
      <span className="uppercase">{variant}</span>

      <div className="flex items-center gap-2">
        <button onClick={() => onRemove(variant)} className="px-2">
          -
        </button>

        <span>{count}</span>

      
        <button onClick={() => onAdd(variant)} className="px-2">
          +
        </button>
      </div>
    </div>
  );
}

export default React.memo(VariantRow);
