const TYPES = [
  "Grass", "Fire", "Water", "Lightning",
  "Psychic", "Fighting", "Darkness",
  "Metal", "Fairy", "Dragon", "Colorless"
];

export default function TypeFilters({ selected, onChange }) {
  const toggle = (type) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {TYPES.map(type => (
        <button
          key={type}
          onClick={() => toggle(type)}
          className={`px-2 py-1 rounded ${
            selected.includes(type)
              ? "bg-green-600"
              : "bg-gray-700"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
