export default function Filters({ filter, setFilter }) {
  return (
    <div className="flex gap-2 p-4">
      {["master", "standard", "parallel"].map(f => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1 rounded ${
            filter === f
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {f.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
