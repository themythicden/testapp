const SUPERTYPES = [
  {
    name: "Pokémon"
  },
  {
    name: "Trainer"
  },
  {
    name: "Energy"
  }
];

export default function SupertypeFilters({
  selected,
  onChange
}) {
  const toggle = type => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="flex justify-center items-center flex-wrap gap-3 w-full m-2">
      {SUPERTYPES.map(({ name, icon }) => {
        const active = selected.includes(name);

        return (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className={`
              px-5 py-2
              rounded-full
              font-semibold
              flex items-center gap-2
              transition-all duration-200
              border
              ${
                active
                  ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/30 scale-105"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              }
            `}
          >
            <span className="text-lg">{icon}</span>
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
}
