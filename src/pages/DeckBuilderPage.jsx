import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LIMITLESS_SET_MAP = {
  TEF: "sv5",
  TWM: "sv6",
  SFA: "sv6pt5",
  SCR: "sv7",
  SSP: "sv8",
  PRE: "sv8pt5",
  JTG: "sv9",
  DRI: "sv10",
  BLK: "zsv10pt5",
  WHT: "rsv10pt5",
  MEG: "me1",
  PFL: "me2",
  ASC: "me2pt5",
  POR: "me3",
  CRI: "me4",
  PBL: "me5"
};

const INTERNAL_TO_LIMITLESS = Object.fromEntries(
  Object.entries(LIMITLESS_SET_MAP).map(([limitless, internal]) => [internal, limitless])
);

function isLegalRegulationMark(mark) {
  const value = String(mark || "").trim().toUpperCase();
  return value && value >= "H";
}

function getDisplaySetCode(card) {
  const internal = String(card?.set_code || "").trim();
  return INTERNAL_TO_LIMITLESS[internal] || internal.toUpperCase();
}

function getDisplayCardNumber(card) {
  const id = String(card?.id || "");
  const setCode = String(card?.set_code || "");
  const prefix = setCode ? `${setCode}-` : "";

  if (prefix && id.toLowerCase().startsWith(prefix.toLowerCase())) {
    return id.slice(prefix.length);
  }

  return String(card?.number ?? "");
}

function getCardLabel(card) {
  return `${card?.name || "Unknown"} (${getDisplaySetCode(card)}) ${getDisplayCardNumber(card)}`;
}

function parseDeckLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/^(Pokémon|Pokemon|Trainer|Energy)\s*:/i.test(trimmed)) {
    return { type: "section", section: trimmed.split(":")[0] };
  }

  const match = trimmed.match(/^(\d+)\s+(.+?)\s+([A-Z0-9]+)\s+([A-Za-z0-9-]+)$/);
  if (!match) return { type: "invalid", raw: trimmed };

  return {
    type: "card",
    quantity: Number(match[1]),
    name: match[2].trim(),
    limitlessSetCode: match[3].trim().toUpperCase(),
    number: match[4].trim()
  };
}

async function resolveExactCard(entry) {
  const internalSetCode = LIMITLESS_SET_MAP[entry.limitlessSetCode];

  if (!internalSetCode) {
    return { card: null, error: `No mapping found for ${entry.limitlessSetCode}.` };
  }

  const numericNumber = Number(String(entry.number).match(/\d+/)?.[0] || 0);

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("set_code", internalSetCode)
    .eq("number", numericNumber)
    .limit(25);

  if (error) return { card: null, error: error.message };

  const candidates = data || [];
  const exactName = candidates.find(
    card =>
      String(card.name || "").trim().toLowerCase() ===
      String(entry.name || "").trim().toLowerCase()
  );

  if (exactName) return { card: exactName, error: null };
  if (candidates.length === 1) return { card: candidates[0], error: null };

  return {
    card: null,
    error: `Could not uniquely resolve ${entry.name} ${entry.limitlessSetCode} ${entry.number}.`
  };
}

async function findLegalAlternatives(cardName, currentCardId) {
  const search = String(cardName || "").trim();

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .ilike("name", `%${search}%`)
    .range(0, 500);

  if (error) {
    console.error("Alternative lookup failed:", error);
    return [];
  }

  return (data || [])
    .filter(card => isLegalRegulationMark(card.regulation_mark))
    .filter(card => card.id !== currentCardId)
    .sort((a, b) => {
      const nameCompare = String(a.name || "").localeCompare(String(b.name || ""));
      if (nameCompare) return nameCompare;

      const setCompare = getDisplaySetCode(a).localeCompare(getDisplaySetCode(b));
      if (setCompare) return setCompare;

      return Number(a.number || 0) - Number(b.number || 0);
    });
}

function PreviewModal({ card, onClose }) {
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-4 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-xl">{getCardLabel(card)}</h3>
            <p className="text-sm text-gray-400">
              Regulation mark: {card.regulation_mark || "None"}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-300">×</button>
        </div>

        <img
          src={card.image_large || card.image_small}
          alt={card.name}
          className="max-h-[70vh] mx-auto rounded-xl"
        />
      </div>
    </div>
  );
}

export default function DeckBuilderPage({ user }) {
  const [deckText, setDeckText] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  const resolvedCount = useMemo(
    () => rows.filter(row => row.card).length,
    [rows]
  );

  async function parseDeck() {
    setLoading(true);

    try {
      const result = [];
      let section = "Other";

      for (const line of deckText.split(/\r?\n/)) {
        const parsed = parseDeckLine(line);
        if (!parsed) continue;

        if (parsed.type === "section") {
          section = parsed.section;
          continue;
        }

        if (parsed.type === "invalid") {
          result.push({
            id: crypto.randomUUID(),
            raw: parsed.raw,
            section,
            card: null,
            error: "Could not parse this line.",
            alternatives: []
          });
          continue;
        }

        const resolved = await resolveExactCard(parsed);

        result.push({
          id: crypto.randomUUID(),
          ...parsed,
          section,
          card: resolved.card,
          error: resolved.error,
          alternatives: [],
          alternativesLoaded: false,
          alternativesLoading: false
        });
      }

      setRows(result);
    } finally {
      setLoading(false);
    }
  }

  async function loadAlternatives(rowId) {
    const target = rows.find(row => row.id === rowId);
    if (!target?.card) return;

    setRows(current =>
      current.map(row =>
        row.id === rowId ? { ...row, alternativesLoading: true } : row
      )
    );

    const alternatives = await findLegalAlternatives(
      target.card.name,
      target.card.id
    );

    setRows(current =>
      current.map(row =>
        row.id === rowId
          ? {
              ...row,
              alternatives,
              alternativesLoaded: true,
              alternativesLoading: false
            }
          : row
      )
    );
  }

  function selectPrinting(rowId, cardId) {
    setRows(current =>
      current.map(row => {
        if (row.id !== rowId) return row;

        const selected = row.alternatives.find(card => card.id === cardId);
        return selected ? { ...row, card: selected } : row;
      })
    );
  }

  if (!user) return <div className="p-4 text-white">Please log in</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deck Builder v1</h1>
        <p className="text-gray-400 mt-1">
          Exact Limitless printing first, then optionally switch to another legal H+ printing.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <textarea
          value={deckText}
          onChange={e => setDeckText(e.target.value)}
          placeholder="4 Dreepy TWM 128"
          className="w-full min-h-48 bg-gray-950 border border-gray-700 rounded-xl p-3"
        />

        <button
          onClick={parseDeck}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Resolving..." : "Parse Deck"}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            {resolvedCount} card line{resolvedCount === 1 ? "" : "s"} resolved
          </div>

          {rows.map(row => (
            <div
              key={row.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
            >
              {!row.card ? (
                <>
                  <p className="text-red-400">
                    {row.raw || `${row.quantity} ${row.name} ${row.limitlessSetCode} ${row.number}`}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{row.error}</p>
                </>
              ) : (
                <div className="grid md:grid-cols-[100px_1fr] gap-4">
                  <button onClick={() => setPreviewCard(row.card)}>
                    <img
                      src={row.card.image_small || row.card.image_large}
                      alt={row.card.name}
                      className="w-24 rounded-lg hover:ring-2 hover:ring-blue-500"
                    />
                  </button>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{getCardLabel(row.card)}</h3>
                      <p className="text-sm text-gray-400">
                        Imported as: {row.name} ({row.limitlessSetCode}) {row.number}
                      </p>
                      <p className="text-sm text-gray-400">
                        Regulation: {row.card.regulation_mark || "None"}
                      </p>
                    </div>

                    {!row.alternativesLoaded ? (
                      <button
                        onClick={() => loadAlternatives(row.id)}
                        disabled={row.alternativesLoading}
                        className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                      >
                        {row.alternativesLoading
                          ? "Finding legal printings..."
                          : "Find other legal printings"}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={row.card.id}
                          onChange={e => selectPrinting(row.id, e.target.value)}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2"
                        >
                          <option value={row.card.id}>
                            {getCardLabel(row.card)}
                          </option>

                          {row.alternatives.map(card => (
                            <option key={card.id} value={card.id}>
                              {getCardLabel(card)}
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                          {row.alternatives.map(card => (
                            <div
                              key={card.id}
                              className="bg-gray-950 border border-gray-800 rounded-xl p-2"
                            >
                              <button
                                onClick={() => setPreviewCard(card)}
                                className="w-full"
                              >
                                <img
                                  src={card.image_small || card.image_large}
                                  alt={card.name}
                                  className="w-full rounded-lg hover:ring-2 hover:ring-blue-500"
                                />
                              </button>

                              <p className="text-xs mt-2 text-center">
                                {getCardLabel(card)}
                              </p>

                              <button
                                onClick={() => selectPrinting(row.id, card.id)}
                                className="w-full mt-2 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
                              >
                                Use this printing
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />
    </div>
  );
}
