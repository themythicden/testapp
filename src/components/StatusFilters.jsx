export default function StatusFilters({
  statusFilter,
  setStatusFilter
}) {
  const filters = ["all", "owned", "needed", "duplicates"];

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap bg-transparent m-1">
      {filters.map(f => (
        <button
          key={f}
          onClick={() => setStatusFilter(f)}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            statusFilter === f
              ? "bg-green-600 text-white shadow-lg"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
