import { SET_CONFIG } from "../utils/setConfig";

export default function Filters({ setCode, current, onChange }) {
  const config = SET_CONFIG[setCode];

  if (!config) return null;

  const views = Object.keys(config.views);

  return (
    <div className="flex gap-2 flex-wrap bg-pink-600">
      {views.map(view => (
        <button
          key={view}
          onClick={() => onChange(view)}
          className={`px-3 py-1 rounded ${
            current === view
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {view.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
