const TYPES = [
  { name: "Grass", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx3b-faf247b4-bbcf-4a1d-bba4-47236408df42.png/v1/fill/w_895,h_893/grass_energy_card_vector_symbol_by_biochao_dezrx3b-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngzYi1mYWYyNDdiNC1iYmNmLTRhMWQtYmJhNC00NzIzNjQwOGRmNDIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.v0SgQMk7iwFm8A8ioBspKkccaGRlen7WumKqgYvV5Lg" },
  { name: "Fire", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx2m-6a187f20-c54f-443c-abb5-6304a14d1d39.png/v1/fill/w_895,h_893/fire_energy_card_vector_symbol_by_biochao_dezrx2m-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngybS02YTE4N2YyMC1jNTRmLTQ0M2MtYWJiNS02MzA0YTE0ZDFkMzkucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.AfkXloJcWbJapFbFOBXFXgPIq7FKrvY3MmC-_Tw3-KY" },
  { name: "Water", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx5f-e4595600-3e33-4241-9b2b-74aaa2eef412.png/v1/fill/w_895,h_893/water_energy_card_vector_symbol_by_biochao_dezrx5f-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cng1Zi1lNDU5NTYwMC0zZTMzLTQyNDEtOWIyYi03NGFhYTJlZWY0MTIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.irBHk7FcSHWWbxsZneFpeUQgK3rEblUKbBOqVi-J-AE" },
  { name: "Lightning", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx16-513fe1dd-38ed-427b-bd33-f06c814bf32f.png/v1/fill/w_895,h_893/electric_energy_card_vector_symbol_by_biochao_dezrx16-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngxNi01MTNmZTFkZC0zOGVkLTQyN2ItYmQzMy1mMDZjODE0YmYzMmYucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.nY2YDb30CgkkPOcir7KrCGtFrndDuY2jKew9o2rD84Q"},
  { name: "Psychic", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx4c-6cff5589-ce3b-4135-8ace-ee3bec01aa7e.png/v1/fill/w_895,h_893/psychic_energy_card_vector_symbol_by_biochao_dezrx4c-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cng0Yy02Y2ZmNTU4OS1jZTNiLTQxMzUtOGFjZS1lZTNiZWMwMWFhN2UucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.cDarrY-ZCxuzoDdNI0IL_a1dZE_-aQXgHaBPM6iSQtI"},
  { name: "Fighting", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx1z-f8ecfab3-6ba7-47a2-90b3-2e95bdcf0bfe.png/v1/fill/w_895,h_893/fighting_energy_card_vector_symbol_by_biochao_dezrx1z-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngxei1mOGVjZmFiMy02YmE3LTQ3YTItOTBiMy0yZTk1YmRjZjBiZmUucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.HeOZJ5l5itk37i5IA-1bviqDgi5Nc5feCRrKC8_EVGw"},
  { name: "Darkness", icon:  "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx06-5b31bdc5-e822-4f80-8d88-af30c132d4fb.png/v1/fill/w_894,h_894/dark_energy_card_vector_symbol_by_biochao_dezrx06-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OSIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngwNi01YjMxYmRjNS1lODIyLTRmODAtOGQ4OC1hZjMwYzEzMmQ0ZmIucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.W_auDW6Byl29meTCesqneIpi4yKImi6PlQgpKEUDzrE"},
  { name: "Metal", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx4z-608133ef-0158-48f9-8786-b8a39fd7e97f.png/v1/fill/w_895,h_893/steel_energy_card_vector_symbol_by_biochao_dezrx4z-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3NyIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cng0ei02MDgxMzNlZi0wMTU4LTQ4ZjktODc4Ni1iOGEzOWZkN2U5N2YucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.wzeVw7yZKDBgSQHdm3BoaDq3zNtvU9R7q7xw3qbWqpI"},
  //fairy: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx1n-b886ead9-e7f6-4b2e-aad3-f2b03e6a23d0.png/v1/fill/w_894,h_894/fairy_energy_card_vector_symbol_by_biochao_dezrx1n-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MSIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngxbi1iODg2ZWFkOS1lN2Y2LTRiMmUtYWFkMy1mMmIwM2U2YTIzZDAucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.RkOxhsmF47eYDVIRpW8l8Zs4jOS_1TUp8Xt2Z_Co90E",
  { name: "Dragon", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrx0m-156163e8-ce81-471d-b174-a1bf9c1b9923.png/v1/fill/w_895,h_893/dragon_energy_card_vector_symbol_by_biochao_dezrx0m-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI3OCIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cngwbS0xNTYxNjNlOC1jZTgxLTQ3MWQtYjE3NC1hMWJmOWMxYjk5MjMucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.9Nsw8Q9qMw7pe20hvpnt4wPOp6JR0D0NmkIaQ3qH9ns"},
  { name: "Colorless", icon: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/dezrwzj-a0900a9f-ecf0-4ff5-8626-83335695a144.png/v1/fill/w_893,h_895/colorless_energy_card_vector_symbol_by_biochao_dezrwzj-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MiIsInBhdGgiOiIvZi83N2JmM2JhOS0wYWFjLTQ0NTItYmU4Mi1kZTUzNmI1YWFiMzIvZGV6cnd6ai1hMDkwMGE5Zi1lY2YwLTRmZjUtODYyNi04MzMzNTY5NWExNDQucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.yzx6pd586t6g1Ii20zLArhh2ep--glR8F-PLykiktOw"}

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
    <div className="flex flex-wrap gap-2 w-full bg-cyan-600">
      {TYPES.map(({ name, icon }) => {
        const active = selected.includes(name);

        return (
          <button
            key={name}
            onClick={() => toggle(name)}
            className={`p-2 rounded-full border-2 ${
              active ? "border-green-400 scale-110" : "border-gray-600 opacity-60"
            }`}
          >
            <img src={icon} alt={name} className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
}
