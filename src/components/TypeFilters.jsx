const TYPES = [
  { name: "Grass", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx3b-faf247b4-bbcf-4a1d-bba4-47236408df42.png/v1/fill/w_895,h_893/grass_energy_card_vector_symbol_by_biochao_dezrx3b-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngzYi1mYWYyNDdiNC1iYmNmLTRhMWQtYmJhNC00NzIzNjQwOGRmNDIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.v0SgQMk7iwFm8A8ioBspKkccaGRlen7WumKqgYvV5Lg" },
  { name: "Fire", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx2m-6a187f20-c54f-443c-abb5-6304a14d1d39.png/v1/fill/w_895,h_893/fire_energy_card_vector_symbol_by_biochao_dezrx2m-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngybS02YTE4N2YyMC1jNTRmLTQ0M2MtYWJiNS02MzA0YTE0ZDFkMzkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.AfkXloJcWbJapFbFOBXFXgPIq7FKrvY3MmC-_Tw3-KY" },
  { name: "Water", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx5f-e4595600-3e33-4241-9b2b-74aaa2eef412.png/v1/fill/w_895,h_893/water_energy_card_vector_symbol_by_biochao_dezrx5f-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cng1Zi1lNDU5NTYwMC0zZTMzLTQyNDEtOWIyYi03NGFhYTJlZWY0MTIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.irBHk7FcSHWWbxsZneFpeUQgK3rEblUKbBOqVi-J-AE" },
  { name: "Lightning", icon: "/icons/lightning.png" },
  { name: "Psychic", icon: "/icons/psychic.png" },
  { name: "Fighting", icon: "/icons/fighting.png" },
  { name: "Darkness", icon: "/icons/darkness.png" },
  { name: "Metal", icon: "/icons/metal.png" },
  { name: "Dragon", icon: "/icons/dragon.png" },
  { name: "Colorless", icon: "/icons/colorless.png" }
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
          onClick={() => toggle(name)}
          className={`p-2 rounded-full border-2 ${
            active ? "border-green-400 scale-100" : "border-gray-600 opacity-60"
          }`}
        >
          <img src={icon} alt{name} className="w-6 h-6" />
        </button>
        );
      )}
    </div>
  );
}
