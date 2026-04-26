export default function ISOVariantSelector({ card, selected, onChange }) {
  const variants = getVariants(card, "master"); // show ALL possible

  const options = ["any", ...variants];

  const toggle = (variant) => {
    if (variant === "any") {
      return onChange(["any"]);
    }

    let next = selected.includes(variant)
      ? selected.filter(v => v !== variant)
      : [...selected.filter(v => v !== "any"), variant];

    if (next.length === 0) next = ["any"];

    onChange(next);
  };

  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {options.map(v => (
        <button
          key={v}
          onClick={() => toggle(v)}
          className={`px-2 py-1 text-xs rounded ${
            selected.includes(v)
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
