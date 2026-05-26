const TYPES = [
  {
    name: "Grass",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx3b-faf247b4-bbcf-4a1d-bba4-47236408df42.png"
  },
  {
    name: "Fire",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx2m-6a187f20-c54f-443c-abb5-6304a14d1d39.png"
  },
  {
    name: "Water",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx5f-e4595600-3e33-4241-9b2b-74aaa2eef412.png"
  },
  {
    name: "Lightning",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx16-513fe1dd-38ed-427b-bd33-f06c814bf32f.png"
  },
  {
    name: "Psychic",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx4c-6cff5589-ce3b-4135-8ace-ee3bec01aa7e.png"
  },
  {
    name: "Fighting",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx1z-f8ecfab3-6ba7-47a2-90b3-2e95bdcf0bfe.png"
  },
  {
    name: "Darkness",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx06-5b31bdc5-e822-4f80-8d88-af30c132d4fb.png"
  },
  {
    name: "Metal",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx4z-608133ef-0158-48f9-8786-b8a39fd7e97f.png"
  },
  {
    name: "Dragon",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx0m-156163e8-ce81-471d-b174-a1bf9c1b9923.png"
  },
  {
    name: "Colorless",
    icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrwzj-a0900a9f-ecf0-4ff5-8626-83335695a144.png"
  }
];

export default function TypeFilters({ selected, onChange }) {
  const toggle = type => {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="flex justify-center items-center flex-wrap gap-3 w-full">
      {TYPES.map(({ name, icon }) => {
        const active = selected.includes(name);

        return (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            title={name}
            className={`
              relative
              w-12 h-12
              rounded-full
              flex items-center justify-center
              transition-all duration-200
              border-2
              ${
                active
                  ? "border-cyan-400 bg-cyan-500/20 scale-110 shadow-lg shadow-cyan-500/30"
                  : "border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-700"
              }
            `}
          >
            <img
              src={icon}
              alt={name}
              className={`w-7 h-7 transition-opacity ${
                active ? "opacity-100" : "opacity-70"
              }`}
            />

            {active && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border border-gray-900" />
            )}
          </button>
        );
      })}
    </div>
  );
}
