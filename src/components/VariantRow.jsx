import React from "react";

function VariantRow({ variant, count, onAdd, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-gray-600 p-2 rounded text-white">
      <span className="uppercase">{variant}</span>

      <div className="flex items-center gap-2">
        <button onClick={() => onRemove(variant)} className="px-2 text-xl">
          -
        </button>

        <span>{count}</span>

      
        <button onClick={() => onAdd(variant)} className="px-2 text-xl">
          +
        </button>
      </div>
    </div>
  );
}

export default React.memo(VariantRow);
