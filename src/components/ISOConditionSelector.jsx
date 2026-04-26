const CONDITIONS = ["any", "nm", "lp", "mp", "hp"];

export default function ISOConditionSelector({ selected, onChange }) {
  const toggle = (condition) => {
    if (condition === "any") {
      return onChange(["any"]);
    }

    let next = selected.includes(condition)
      ? selected.filter(c => c !== condition)
      : [...selected.filter(c => c !== "any"), condition];

    if (next.length === 0) next = ["any"];

    onChange(next);
  };

  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {CONDITIONS.map(c => (
        <button
          key={c}
          onClick={() => toggle(c)}
          className={`px-2 py-1 text-xs rounded ${
            selected.includes(c)
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {c.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
