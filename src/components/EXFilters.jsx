export default function ExFilters({
  exFilter,
  setExFilter
}) {
  const options = [
    {
      value: "all",
      label: "All"
    },
    {
      value: "only",
      label: "EX Only"
    },
    {
      value: "hide",
      label: "Hide EX"
    }
  ];

  return (
    <div className="flex justify-center items-center flex-wrap gap-3 w-full m-2">
      {options.map(option => {
        const active = exFilter === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setExFilter(option.value)}
            className={`
              px-5 py-2
              rounded-full
              font-semibold
              transition-all duration-200
              border
              ${
                active
                  ? "bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/30 scale-105"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
