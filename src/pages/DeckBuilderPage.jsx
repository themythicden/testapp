import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const LIMITLESS_SET_MAP = {
  SVE: "sve",
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
  MEE: "mee",
  MEG: "me1",
  PFL: "me2",
  ASC: "me2pt5",
  POR: "me3",
  CRI: "me4",
  PBL: "me5"
};

const INTERNAL_TO_LIMITLESS = Object.fromEntries(
  Object.entries(LIMITLESS_SET_MAP).map(([limitless, internal]) => [
    internal,
    limitless
  ])
);

function isLegalRegulationMark(mark) {
  const value = String(mark || "").trim().toUpperCase();
  if (!value) return false;

  const first = value.charAt(0);
  return first >= "H" && first <= "Z";
}

function getDisplaySetCode(card) {
  const internal = String(card?.set_code || "").trim();
  return INTERNAL_TO_LIMITLESS[internal] || internal.toUpperCase();
}

function getDisplayCardNumber(card) {
  const id = String(card?.id || "").trim();
  const setCode = String(card?.set_code || "").trim();

  if (id && setCode) {
    const prefix = `${setCode}-`;

    if (id.toLowerCase().startsWith(prefix.toLowerCase())) {
      return id.slice(prefix.length);
    }
  }

  return String(card?.number ?? "");
}

function getCardLabel(card) {
  return `${card?.name || "Unknown"} (${getDisplaySetCode(
    card
  )}) ${getDisplayCardNumber(card)}`;
}

function parseDeckLine(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  if (/^(Pokémon|Pokemon|Trainer|Energy)\s*:/i.test(trimmed)) {
    return {
      type: "section",
      section: trimmed.split(":")[0]
    };
  }

  const match = trimmed.match(
    /^(\d+)\s+(.+?)\s+([A-Z0-9]+)\s+([A-Za-z0-9-]+)$/
  );

  if (!match) {
    return {
      type: "invalid",
      raw: trimmed
    };
  }

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
    return {
      card: null,
      error: `No set mapping found for ${entry.limitlessSetCode}.`
    };
  }

  const numericNumber = Number(
    String(entry.number).match(/\d+/)?.[0] || 0
  );

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("set_code", internalSetCode)
    .eq("number", numericNumber)
    .limit(50);

  if (error) {
    return {
      card: null,
      error: error.message
    };
  }

  const candidates = data || [];

  const exactName = candidates.find(card => {
    return (
      String(card.name || "")
        .trim()
        .toLowerCase() ===
      String(entry.name || "")
        .trim()
        .toLowerCase()
    );
  });

  if (exactName) {
    return {
      card: exactName,
      error: null
    };
  }

  if (candidates.length === 1) {
    return {
      card: candidates[0],
      error: null
    };
  }

  return {
    card: null,
    error: `Could not uniquely resolve ${entry.name} ${entry.limitlessSetCode} ${entry.number}.`
  };
}

async function findLegalAlternatives(cardName, currentCardId) {
  const search = String(cardName || "").trim();

  if (!search) {
    return [];
  }

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .ilike("name", `%${search}%`)
    .range(0, 500);

  if (error) {
    console.error("Alternative printing lookup failed:", error);
    return [];
  }

  return (data || [])
    .filter(card => isLegalRegulationMark(card.regulation_mark))
    .filter(card => card.id !== currentCardId)
    .sort((a, b) => {
      const nameCompare = String(a.name || "").localeCompare(
        String(b.name || "")
      );

      if (nameCompare !== 0) {
        return nameCompare;
      }

      const setCompare = getDisplaySetCode(a).localeCompare(
        getDisplaySetCode(b)
      );

      if (setCompare !== 0) {
        return setCompare;
      }

      return Number(a.number || 0) - Number(b.number || 0);
    });
}

function PreviewModal({ card, onClose }) {
  if (!card) {
    return null;
  }

  const imageUrl =
    card.image_large ||
    card.image_small ||
    "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-4 max-w-lg w-full"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-xl">
              {getCardLabel(card)}
            </h3>

            <p className="text-sm text-gray-400">
              Regulation mark: {card.regulation_mark || "None"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-300 hover:text-white"
          >
            ×
          </button>
        </div>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="max-h-[70vh] mx-auto rounded-xl object-contain"
          />
        ) : (
          <div className="h-96 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
            No card image available
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeckBuilderPage({ user }) {
  const [deckName, setDeckName] = useState("");
  const [deckText, setDeckText] = useState("");
  const [rows, setRows] = useState([]);

  const [savedDecks, setSavedDecks] = useState([]);
  const [activeDeckId, setActiveDeckId] = useState(null);

  const [includeCollectionCards, setIncludeCollectionCards] =
    useState(false);

  const [collectionCounts, setCollectionCounts] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  useEffect(() => {
    if (!user?.email) {
      return;
    }

    loadSavedDecks();
  }, [user?.email]);

  useEffect(() => {
    if (!includeCollectionCards || !user?.email || rows.length === 0) {
      setCollectionCounts({});
      return;
    }

    loadCollectionCounts();
  }, [includeCollectionCards, rows, user?.email]);

  async function loadSavedDecks() {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading decks:", error);
      return;
    }

    setSavedDecks(data || []);
  }

  async function loadDeck(deck) {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("deck_cards")
        .select(`
          id,
          deck_id,
          card_id,
          quantity,
          owned_quantity,
          section,
          cards (*)
        `)
        .eq("deck_id", deck.id);

      if (error) {
        console.error("Error loading deck cards:", error);
        return;
      }

      const loadedRows = (data || []).map(item => ({
        id: item.id,
        quantity: Number(item.quantity || 1),
        ownedQuantity: Number(item.owned_quantity || 0),
        section: item.section || "Other",
        card: item.cards || null,
        alternatives: [],
        alternativesLoaded: false,
        alternativesLoading: false,
        name: item.cards?.name || "",
        limitlessSetCode: item.cards
          ? getDisplaySetCode(item.cards)
          : "",
        number: item.cards
          ? getDisplayCardNumber(item.cards)
          : ""
      }));

      setActiveDeckId(deck.id);
      setDeckName(deck.name || "");
      setDeckText(deck.raw_decklist || "");
      setRows(loadedRows);
    } finally {
      setLoading(false);
    }
  }

  async function parseDeck() {
    setLoading(true);

    try {
      const result = [];
      let section = "Other";

      for (const line of deckText.split(/\r?\n/)) {
        const parsed = parseDeckLine(line);

        if (!parsed) {
          continue;
        }

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
            quantity: 1,
            ownedQuantity: 0,
            alternatives: [],
            alternativesLoaded: false,
            alternativesLoading: false
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
          ownedQuantity: 0,
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

    if (!target?.card) {
      return;
    }

    setRows(current =>
      current.map(row =>
        row.id === rowId
          ? {
              ...row,
              alternativesLoading: true
            }
          : row
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
        if (row.id !== rowId) {
          return row;
        }

        const selected = row.alternatives.find(
          card => card.id === cardId
        );

        if (!selected) {
          return row;
        }

        return {
          ...row,
          card: selected,
          name: selected.name,
          limitlessSetCode: getDisplaySetCode(selected),
          number: getDisplayCardNumber(selected),
          error: null
        };
      })
    );
  }

  function updateQuantity(rowId, quantity) {
    const value = Math.max(1, Number(quantity) || 1);

    setRows(current =>
      current.map(row =>
        row.id === rowId
          ? {
              ...row,
              quantity: value
            }
          : row
      )
    );
  }

  function updateOwnedQuantity(rowId, quantity) {
    const value = Math.max(0, Number(quantity) || 0);

    setRows(current =>
      current.map(row =>
        row.id === rowId
          ? {
              ...row,
              ownedQuantity: value
            }
          : row
      )
    );
  }

  function removeRow(rowId) {
    setRows(current =>
      current.filter(row => row.id !== rowId)
    );
  }

  async function loadCollectionCounts() {
    const validRows = rows.filter(row => row.card?.id);

    if (validRows.length === 0) {
      setCollectionCounts({});
      return;
    }

    const cardIds = [
      ...new Set(
        validRows.map(row => row.card.id)
      )
    ];

    const { data, error } = await supabase
      .from("user_cards")
      .select("card_id, owned")
      .eq("email", user.email)
      .in("card_id", cardIds)
      .range(0, 10000);

    if (error) {
      console.error("Error loading collection counts:", error);
      return;
    }

    const totals = {};

    (data || []).forEach(item => {
      totals[item.card_id] =
        Number(totals[item.card_id] || 0) +
        Number(item.owned || 0);
    });

    setCollectionCounts(totals);
  }

  function getCollectionOwned(row) {
    if (!includeCollectionCards || !row.card?.id) {
      return 0;
    }

    return Number(collectionCounts[row.card.id] || 0);
  }

  function getStillNeeded(row) {
    const required = Number(row.quantity || 0);
    const deckOwned = Number(row.ownedQuantity || 0);
    const collectionOwned = getCollectionOwned(row);

    return Math.max(
      0,
      required - deckOwned - collectionOwned
    );
  }

  async function saveDeck() {
    if (!user?.email) {
      return;
    }

    if (!deckName.trim()) {
      alert("Please enter a deck name.");
      return;
    }

    const validRows = rows.filter(row => row.card?.id);

    if (validRows.length === 0) {
      alert("There are no resolved cards to save.");
      return;
    }

    setSaving(true);

    try {
      let deckId = activeDeckId;

      if (!deckId) {
        const { data, error } = await supabase
          .from("decks")
          .insert({
            user_email: user.email,
            name: deckName.trim(),
            raw_decklist: deckText
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        deckId = data.id;
        setActiveDeckId(deckId);
      } else {
        const { error } = await supabase
          .from("decks")
          .update({
            name: deckName.trim(),
            raw_decklist: deckText
          })
          .eq("id", deckId)
          .eq("user_email", user.email);

        if (error) {
          throw error;
        }

        const { error: deleteError } = await supabase
          .from("deck_cards")
          .delete()
          .eq("deck_id", deckId);

        if (deleteError) {
          throw deleteError;
        }
      }

      const inserts = validRows.map(row => ({
        deck_id: deckId,
        card_id: row.card.id,
        quantity: Number(row.quantity || 1),
        owned_quantity: Number(row.ownedQuantity || 0),
        section: row.section || "Other"
      }));

      const { error: cardsError } = await supabase
        .from("deck_cards")
        .insert(inserts);

      if (cardsError) {
        throw cardsError;
      }

      await loadSavedDecks();

      alert("Deck saved.");
    } catch (error) {
      console.error("Error saving deck:", error);
      alert(`Could not save deck: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function newDeck() {
    setActiveDeckId(null);
    setDeckName("");
    setDeckText("");
    setRows([]);
    setIncludeCollectionCards(false);
    setCollectionCounts({});
  }

  const totalNeeded = useMemo(() => {
    return rows.reduce((sum, row) => {
      if (!row.card) {
        return sum;
      }

      return sum + getStillNeeded(row);
    }, 0);
  }, [
    rows,
    includeCollectionCards,
    collectionCounts
  ]);

  if (!user) {
    return (
      <div className="p-4 text-white">
        Please log in
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            Deck Builder
          </h1>

          <p className="text-gray-400 mt-1">
            Paste a Limitless list, resolve the exact printing,
            optionally switch to another legal H+ printing,
            and track what is still needed.
          </p>
        </div>

        <button
          type="button"
          onClick={newDeck}
          className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700"
        >
          New Deck
        </button>
      </div>

      {savedDecks.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="font-bold mb-3">
            Saved Decks
          </h2>

          <div className="flex flex-wrap gap-2">
            {savedDecks.map(deck => (
              <button
                key={deck.id}
                type="button"
                onClick={() => loadDeck(deck)}
                className={`px-3 py-2 rounded-lg ${
                  activeDeckId === deck.id
                    ? "bg-blue-600"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {deck.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
        <input
          type="text"
          value={deckName}
          onChange={event =>
            setDeckName(event.target.value)
          }
          placeholder="Deck name"
          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2"
        />

        <textarea
          value={deckText}
          onChange={event =>
            setDeckText(event.target.value)
          }
          placeholder="4 Dreepy TWM 128"
          className="w-full min-h-48 bg-gray-950 border border-gray-700 rounded-xl p-3"
        />

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={parseDeck}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Resolving..."
              : "Parse / Replace Checklist"}
          </button>

          <button
            type="button"
            onClick={saveDeck}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : activeDeckId
                ? "Save Changes"
                : "Save Deck"}
          </button>

          <label className="flex items-center gap-2 ml-auto text-sm">
            <input
              type="checkbox"
              checked={includeCollectionCards}
              onChange={event =>
                setIncludeCollectionCards(
                  event.target.checked
                )
              }
            />

            Include collection cards
          </label>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap justify-between gap-3">
          <div>
            <span className="text-gray-400">
              Card lines:
            </span>{" "}
            {rows.filter(row => row.card).length}
          </div>

          <div>
            <span className="text-gray-400">
              Total cards still needed:
            </span>{" "}
            <span className="font-bold text-yellow-400">
              {totalNeeded}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {rows.map(row => (
          <div
            key={row.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
          >
            {!row.card ? (
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-red-400">
                    {row.raw ||
                      `${row.quantity || ""} ${row.name || ""} ${
                        row.limitlessSetCode || ""
                      } ${row.number || ""}`}
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    {row.error ||
                      "Could not resolve this card."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeRow(row.id)
                  }
                  className="text-red-400"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-[100px_1fr] gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewCard(row.card)
                  }
                  className="self-start"
                >
                  <img
                    src={
                      row.card.image_small ||
                      row.card.image_large
                    }
                    alt={row.card.name}
                    className="w-24 rounded-lg hover:ring-2 hover:ring-blue-500"
                  />
                </button>

                <div className="space-y-4">
                  <div className="flex flex-wrap justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {getCardLabel(row.card)}
                      </h3>

                      {row.limitlessSetCode && (
                        <p className="text-sm text-gray-400">
                          Imported as: {row.name} (
                          {row.limitlessSetCode}){" "}
                          {row.number}
                        </p>
                      )}

                      <p className="text-sm text-gray-400">
                        Regulation:{" "}
                        {row.card.regulation_mark ||
                          "None"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeRow(row.id)
                      }
                      className="text-red-400"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="text-sm text-gray-400">
                      Required
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={event =>
                          updateQuantity(
                            row.id,
                            event.target.value
                          )
                        }
                        className="block mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-2 py-2 text-white"
                      />
                    </label>

                    <label className="text-sm text-gray-400">
                      In Deck
                      <input
                        type="number"
                        min="0"
                        value={row.ownedQuantity || 0}
                        onChange={event =>
                          updateOwnedQuantity(
                            row.id,
                            event.target.value
                          )
                        }
                        className="block mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-2 py-2 text-white"
                      />
                    </label>

                    <div className="text-sm text-gray-400">
                      Collection
                      <div className="mt-1 bg-gray-950 border border-gray-700 rounded-lg px-2 py-2 text-white">
                        {includeCollectionCards
                          ? getCollectionOwned(row)
                          : "—"}
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      Still Needed
                      <div
                        className={`mt-1 border rounded-lg px-2 py-2 font-bold ${
                          getStillNeeded(row) === 0
                            ? "bg-green-950/50 border-green-700 text-green-300"
                            : "bg-yellow-950/50 border-yellow-700 text-yellow-300"
                        }`}
                      >
                        {getStillNeeded(row)}
                      </div>
                    </div>
                  </div>

                  {!row.alternativesLoaded ? (
                    <button
                      type="button"
                      onClick={() =>
                        loadAlternatives(row.id)
                      }
                      disabled={
                        row.alternativesLoading
                      }
                      className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
                    >
                      {row.alternativesLoading
                        ? "Finding legal printings..."
                        : "Find other legal printings"}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm text-gray-400">
                        Legal printing
                      </label>

                      <select
                        value={row.card.id}
                        onChange={event =>
                          selectPrinting(
                            row.id,
                            event.target.value
                          )
                        }
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2"
                      >
                        <option
                          value={row.card.id}
                        >
                          {getCardLabel(row.card)}
                        </option>

                        {row.alternatives.map(
                          card => (
                            <option
                              key={card.id}
                              value={card.id}
                            >
                              {getCardLabel(card)}
                            </option>
                          )
                        )}
                      </select>

                      {row.alternatives.length ===
                      0 ? (
                        <p className="text-sm text-gray-500">
                          No other legal H+
                          printings found.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                          {row.alternatives.map(
                            card => (
                              <div
                                key={card.id}
                                className="bg-gray-950 border border-gray-800 rounded-xl p-2"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewCard(
                                      card
                                    )
                                  }
                                  className="w-full"
                                >
                                  <img
                                    src={
                                      card.image_small ||
                                      card.image_large
                                    }
                                    alt={card.name}
                                    className="w-full rounded-lg hover:ring-2 hover:ring-blue-500"
                                  />
                                </button>

                                <p className="text-xs mt-2 text-center">
                                  {getCardLabel(
                                    card
                                  )}
                                </p>

                                <button
                                  type="button"
                                  onClick={() =>
                                    selectPrinting(
                                      row.id,
                                      card.id
                                    )
                                  }
                                  className="w-full mt-2 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
                                >
                                  Use this printing
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <PreviewModal
        card={previewCard}
        onClose={() => setPreviewCard(null)}
      />
    </div>
  );
}
