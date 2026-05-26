import { SET_CONFIG } from "../utils/setConfig";

export default function Filters({ setCode, current, onChange }) {
  const config = SET_CONFIG[setCode];

  if (!config) return null;

  const views = Object.keys(config.views);

  return (
    <div className="flex justify-center items-center gap-2 flex-wrap bg-transparent m-1">
      {views.map(view => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={`px-4 py-2 rounded-full font-semibold transition ${
            current === view
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {view.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
