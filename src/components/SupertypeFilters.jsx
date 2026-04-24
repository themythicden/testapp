const SUPERTYPES = ["Pokémon", "Trainer", "Energy"];

export default function SupertypeFilters({ selected, onChange }) {
  const toggle = (type) => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="flex gap-2 p-4">
      {SUPERTYPES.map(type => (
        <button
          key={type}
          onClick={() => toggle(type)}
          className={`px-3 py-1 rounded ${
            selected.includes(type)
              ? "bg-purple-600"
              : "bg-gray-700"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
