import { useEffect, useState } from "react";

export default function PriceRefreshButton({
  setCode,
  userEmail,
  myRole
}) {
  const [loading, setLoading] = useState(false);
  const [importedToday, setImportedToday] = useState(false);
  const [message, setMessage] = useState("");

  const canRefresh = ["owner", "editor"].includes(myRole);

  useEffect(() => {
    async function checkStatus() {
      if (!setCode) return;

      const res = await fetch(
        `/.netlify/functions/api?action=getPriceImportStatus&setCode=${setCode}`
      );

      const data = await res.json();

      setImportedToday(!!data.importedToday);
    }

    checkStatus();
  }, [setCode]);

  const refreshPrices = async () => {
    if (!canRefresh || importedToday || loading) return;

    setLoading(true);
    setMessage("");

    const res = await fetch(
      `/.netlify/functions/api?action=importPrices&setCode=${setCode}&email=${encodeURIComponent(userEmail)}`
    );

    const data = await res.json();

    setLoading(false);

    if (data.alreadyImported) {
      setImportedToday(true);
      setMessage("Prices already refreshed today.");
      return;
    }

    if (!res.ok) {
      setMessage(data.error || "Could not refresh prices.");
      return;
    }

    setImportedToday(true);
    setMessage(`Updated ${data.pricesUpdated} prices.`);
  };

  if (!canRefresh) return null;

  return (
    <div className="mx-4 mb-4 bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Market Prices</h3>
          <p className="text-xs text-gray-400">
            Refresh prices once per set per day.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshPrices}
          disabled={loading || importedToday}
          className={`px-4 py-2 rounded-full font-semibold ${
            importedToday
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : loading
                ? "bg-blue-700 text-white cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {importedToday
            ? "Updated Today"
            : loading
              ? "Updating..."
              : "Refresh Prices"}
        </button>
      </div>

      {message && (
        <p className="text-xs text-gray-300 mt-3">
          {message}
        </p>
      )}
    </div>
  );
}
