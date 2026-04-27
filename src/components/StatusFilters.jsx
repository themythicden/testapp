export default function StatusFilters({ statusFilter, setStatusFilter }) {
  const filters = ["all", "owned", "needed", "duplicates"];

  return (
    <div className="flex gap-2 bg-pink-600">
      {filters.map(f => (
        <button
          key={f}
          onClick={() => setStatusFilter(f)}
          className={`px-3 py-1 rounded ${
            statusFilter === f
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
