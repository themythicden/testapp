import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const EMPTY_IMPORT = `Pokémon: 0\n\nTrainer: 0\n\nEnergy: 0`;
const MIN_LEGAL_REGULATION_MARK = "H";

// Limitless/PTCGL abbreviation -> set_code used by your cards table.
// Add new aliases here when a Limitless abbreviation differs from your database set_code.
const LIMITLESS_SET_MAP = {
  TWM: "sv6",
  SCR: "sv7",
  TEF: "sv5",
  DRI: "sv10",
  MEG: "me1",
  PFL: "me2",
  POR: "me3",
  CRI: "me4",
  ASC: "me2pt5"
};

const CARD_FIELDS = [
  "id",
  "name",
  "set_code",
  "number",
  "rarity",
  "supertype",
  "subtypes",
  "image_small",
  "image_large",
  "regulation_mark"
].join(",");

function getDisplayCardNumber(card) {
  const id = String(card?.id || "").trim();
  const setCode = String(card?.set_code || "").trim();

  if (!id) return String(card?.number ?? "");

  const prefix = setCode ? `${setCode}-` : "";
  if (prefix && id.toLowerCase().startsWith(prefix.toLowerCase())) {
    return id.slice(prefix.length);
  }

  const dashIndex = id.indexOf("-");
  return dashIndex >= 0 ? id.slice(dashIndex + 1) : String(card?.number ?? "");
}

function numericCardNumber(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizePrintedNumber(value) {
  return String(value ?? "").trim().toLowerCase().replace(/^0+(?=\d)/, "");
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function isRegulationLegal(mark) {
  const value = String(mark || "").trim().toUpperCase();
  if (!/^[A-Z]$/.test(value)) return false;
  return value.charCodeAt(0) >= MIN_LEGAL_REGULATION_MARK.charCodeAt(0);
}

function sectionLabel(section) {
  if (section === "pokemon") return "Pokémon";
  if (section === "trainer") return "Trainer";
  if (section === "energy") return "Energy";
  return "Other";
}

function parseDecklist(text) {
  const lines = String(text || "").split(/\r?\n/);
  const parsed = [];
  let section = "other";

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index].trim();
    if (!rawLine) continue;

    const sectionMatch = rawLine.match(/^(pok[eé]mon|trainer|energy)\s*:?\s*\d*$/i);
    if (sectionMatch) {
      const key = sectionMatch[1].toLowerCase();
      section = key.startsWith("pok") ? "pokemon" : key;
      continue;
    }

    if (/^total\s+cards?\s*:?/i.test(rawLine)) continue;

    // Limitless / PTCGL format:
    // 4 Dreepy TWM 128
    // 3 Boss's Orders MEG 114
    const match = rawLine.match(/^(\d+)\s+(.+?)\s+([A-Za-z0-9.-]+)\s+([A-Za-z0-9.-]+)$/);

    if (!match) {
      parsed.push({
        key: `line-${index}-${Date.now()}`,
        quantity: 1,
        ownedQuantity: 0,
        section,
        rawLine,
        name: rawLine,
        sourceSetCode: "",
        sourceNumber: "",
        card: null,
        candidates: [],
        resolution: "unmatched"
      });
      continue;
    }

    parsed.push({
      key: `line-${index}-${Date.now()}`,
      quantity: Number(match[1]),
      ownedQuantity: 0,
      section,
      rawLine,
      name: match[2].trim(),
      sourceSetCode: match[3].trim().toUpperCase(),
      sourceNumber: match[4].trim(),
      card: null,
      candidates: [],
      resolution: "pending"
    });
  }

  return parsed;
}

function mappedSetCode(sourceSetCode) {
  const source = String(sourceSetCode || "").trim().toUpperCase();
  return LIMITLESS_SET_MAP[source] || source.toLowerCase();
}

async function fetchLegalPrintingsByName(name) {
  const { data, error } = await supabase
    .from("cards")
    .select(CARD_FIELDS)
    .ilike("name", name)
    .range(0, 250);

  if (error) {
    console.error("Legal printing lookup failed:", name, error);
    return [];
  }

  return (data || [])
    .filter(card => normalizeName(card.name) === normalizeName(name))
    .filter(card => isRegulationLegal(card.regulation_mark))
    .sort((a, b) => {
      const markCompare = String(b.regulation_mark || "").localeCompare(String(a.regulation_mark || ""));
      if (markCompare !== 0) return markCompare;
      return String(a.set_code || "").localeCompare(String(b.set_code || ""));
    });
}

async function resolveImportedCard(item) {
  const numeric = numericCardNumber(item.sourceNumber);
  if (numeric === null) {
    return { card: null, candidates: [], resolution: "unmatched" };
  }

  const dbSetCode = mappedSetCode(item.sourceSetCode);

  // 1) Best case: exact mapped set + numeric number + exact card name.
  if (dbSetCode) {
    const { data, error } = await supabase
      .from("cards")
      .select(CARD_FIELDS)
      .eq("set_code", dbSetCode)
      .eq("number", numeric)
      .ilike("name", item.name)
      .limit(20);

    if (!error && data?.length) {
      const exactName = data.filter(card => normalizeName(card.name) === normalizeName(item.name));
      const exactPrinted = exactName.filter(
        card => normalizePrintedNumber(getDisplayCardNumber(card)) === normalizePrintedNumber(item.sourceNumber)
      );
      const best = exactPrinted.length ? exactPrinted : exactName;

      if (best.length === 1 && isRegulationLegal(best[0].regulation_mark)) {
        return { card: best[0], candidates: [], resolution: "resolved" };
      }

      if (best.length > 0) {
        const legal = best.filter(card => isRegulationLegal(card.regulation_mark));
        if (legal.length === 1) {
          return { card: legal[0], candidates: [], resolution: "resolved" };
        }
        if (legal.length > 1) {
          return { card: null, candidates: legal, resolution: "ambiguous" };
        }
      }
    }
  }

  // 2) Fallback: same card name + number across all sets.
  const { data, error } = await supabase
    .from("cards")
    .select(CARD_FIELDS)
    .eq("number", numeric)
    .ilike("name", item.name)
    .limit(100);

  if (!error && data?.length) {
    const exactName = data.filter(card => normalizeName(card.name) === normalizeName(item.name));
    const exactPrinted = exactName.filter(
      card => normalizePrintedNumber(getDisplayCardNumber(card)) === normalizePrintedNumber(item.sourceNumber)
    );
    const legal = (exactPrinted.length ? exactPrinted : exactName).filter(card =>
      isRegulationLegal(card.regulation_mark)
    );

    if (legal.length === 1) {
      return { card: legal[0], candidates: [], resolution: "resolved" };
    }
    if (legal.length > 1) {
      return { card: null, candidates: legal, resolution: "ambiguous" };
    }
  }

  // 3) If the exact printing is not available in the database, offer every legal
  // same-name printing so the user can compare and choose deliberately.
  const legalAlternatives = await fetchLegalPrintingsByName(item.name);

  return {
    card: null,
    candidates: legalAlternatives,
    resolution: legalAlternatives.length ? "ambiguous" : "unmatched"
  };
}

function mergeResolvedItems(items) {
  const result = [];
  const indexByCardId = new Map();

  for (const item of items) {
    if (!item.card?.id) {
      result.push(item);
      continue;
    }

    const existingIndex = indexByCardId.get(item.card.id);
    if (existingIndex === undefined) {
      indexByCardId.set(item.card.id, result.length);
      result.push(item);
      continue;
    }

    result[existingIndex] = {
      ...result[existingIndex],
      quantity: result[existingIndex].quantity + item.quantity
    };
  }

  return result;
}

export default function DeckBuilderPage({ user }) {
  const [savedDecks, setSavedDecks] = useState([]);
  const [deckId, setDeckId] = useState(null);
  const [deckName, setDeckName] = useState("");
  const [rawDecklist, setRawDecklist] = useState("");
  const [items, setItems] = useState([]);
  const [includeCollectionCards, setIncludeCollectionCards] = useState(false);
  const [collectionOwned, setCollectionOwned] = useState({});
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);
  const [printingPicker, setPrintingPicker] = useState(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setSavedDecks([]);
      return;
    }
    loadSavedDecks();
  }, [user?.email]);

  useEffect(() => {
    if (!includeCollectionCards || !user?.email || !items.length) {
      setCollectionOwned({});
      return;
    }
    loadCollectionOwnership(items);
  }, [includeCollectionCards, user?.email, items]);

  async function loadSavedDecks() {
    setLoadingDecks(true);
    const { data, error } = await supabase
      .from("decks")
      .select("id,name,raw_decklist,created_at")
      .eq("user_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading decks:", error);
      setMessage(`Could not load saved decks: ${error.message}`);
    } else {
      setSavedDecks(data || []);
    }
    setLoadingDecks(false);
  }

  async function loadCollectionOwnership(deckItems) {
    const ids = [...new Set(deckItems.map(item => item.card?.id).filter(Boolean))];
    if (!ids.length) {
      setCollectionOwned({});
      return;
    }

    const { data, error } = await supabase
      .from("user_cards")
      .select("card_id,owned")
      .eq("email", user.email)
      .in("card_id", ids)
      .range(0, 10000);

    if (error) {
      console.error("Error loading collection ownership:", error);
      return;
    }

    const totals = {};
    for (const row of data || []) {
      totals[row.card_id] = (totals[row.card_id] || 0) + Number(row.owned || 0);
    }
    setCollectionOwned(totals);
  }

  async function handleParse() {
    setMessage("");
    const parsed = parseDecklist(rawDecklist);

    if (!parsed.length) {
      setMessage("No deck lines were found. Paste a Limitless/PTCGL-style deck list first.");
      return;
    }

    setParsing(true);
    const resolved = [];

    try {
      for (const item of parsed) {
        if (item.resolution === "unmatched" && !item.sourceNumber) {
          resolved.push(item);
          continue;
        }

        const result = await resolveImportedCard(item);
        resolved.push({ ...item, ...result });
      }

      setItems(mergeResolvedItems(resolved));
    } finally {
      setParsing(false);
    }
  }

  async function openDeck(id) {
    setMessage("");

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id,user_email,name,raw_decklist,created_at")
      .eq("id", id)
      .eq("user_email", user.email)
      .single();

    if (deckError) {
      setMessage(`Could not open deck: ${deckError.message}`);
      return;
    }

    const { data: rows, error: cardsError } = await supabase
      .from("deck_cards")
      .select("id,deck_id,card_id,quantity,owned_quantity,section,cards(*)")
      .eq("deck_id", id);

    if (cardsError) {
      setMessage(`Could not load deck cards: ${cardsError.message}`);
      return;
    }

    setDeckId(deck.id);
    setDeckName(deck.name || "");
    setRawDecklist(deck.raw_decklist || "");
    setIncludeCollectionCards(false);
    setItems(
      (rows || []).map((row, index) => ({
        key: row.id || `saved-${index}`,
        deckCardId: row.id,
        quantity: Number(row.quantity || 1),
        ownedQuantity: Number(row.owned_quantity || 0),
        section: row.section || "other",
        rawLine: "",
        name: row.cards?.name || row.card_id,
        sourceSetCode: row.cards?.set_code || "",
        sourceNumber: row.cards ? getDisplayCardNumber(row.cards) : "",
        card: row.cards || null,
        candidates: [],
        resolution: row.cards ? "resolved" : "unmatched"
      }))
    );
  }

  function newDeck() {
    setDeckId(null);
    setDeckName("");
    setRawDecklist("");
    setItems([]);
    setIncludeCollectionCards(false);
    setCollectionOwned({});
    setMessage("");
  }

  function updateItem(key, changes) {
    setItems(current => current.map(item => (item.key === key ? { ...item, ...changes } : item)));
  }

  function removeItem(key) {
    setItems(current => current.filter(item => item.key !== key));
  }

  function chooseCandidate(key, cardId) {
    setItems(current =>
      current.map(item => {
        if (item.key !== key) return item;
        const card = item.candidates.find(candidate => candidate.id === cardId) || null;
        return { ...item, card, resolution: card ? "resolved" : "ambiguous" };
      })
    );
  }

  async function openPrintingPicker(item) {
    setLoadingAlternatives(true);
    const alternatives = await fetchLegalPrintingsByName(item.card?.name || item.name);
    setLoadingAlternatives(false);

    setPrintingPicker({
      itemKey: item.key,
      cardName: item.card?.name || item.name,
      currentCardId: item.card?.id || null,
      cards: alternatives
    });
  }

  function selectPrinting(card) {
    if (!printingPicker) return;
    updateItem(printingPicker.itemKey, {
      card,
      name: card.name,
      sourceSetCode: card.set_code,
      sourceNumber: getDisplayCardNumber(card),
      resolution: "resolved",
      candidates: []
    });
    setPrintingPicker(null);
  }

  async function searchCards() {
    const term = manualSearch.trim();
    if (!term) return;

    setSearching(true);
    const { data, error } = await supabase
      .from("cards")
      .select(CARD_FIELDS)
      .ilike("name", `%${term}%`)
      .limit(80);

    if (error) {
      setMessage(`Card search failed: ${error.message}`);
    } else {
      setManualResults((data || []).filter(card => isRegulationLegal(card.regulation_mark)));
    }
    setSearching(false);
  }

  function addManualCard(card) {
    const existing = items.find(item => item.card?.id === card.id);
    if (existing) {
      updateItem(existing.key, { quantity: existing.quantity + 1 });
      return;
    }

    setItems(current => [
      ...current,
      {
        key: `manual-${card.id}-${Date.now()}`,
        quantity: 1,
        ownedQuantity: 0,
        section:
          String(card.supertype || "").toLowerCase() === "pokémon" ||
          String(card.supertype || "").toLowerCase() === "pokemon"
            ? "pokemon"
            : String(card.supertype || "").toLowerCase() === "trainer"
              ? "trainer"
              : String(card.supertype || "").toLowerCase() === "energy"
                ? "energy"
                : "other",
        rawLine: "",
        name: card.name,
        sourceSetCode: card.set_code,
        sourceNumber: getDisplayCardNumber(card),
        card,
        candidates: [],
        resolution: "resolved"
      }
    ]);
  }

  async function saveDeck() {
    if (!user?.email) return;
    if (!deckName.trim()) {
      setMessage("Give the deck a name before saving.");
      return;
    }

    const unresolved = items.filter(item => !item.card?.id);
    if (unresolved.length) {
      setMessage(`Resolve or remove ${unresolved.length} unmatched deck line(s) before saving.`);
      return;
    }

    if (!items.length) {
      setMessage("Add at least one card before saving the deck.");
      return;
    }

    setSaving(true);
    setMessage("");

    let savedDeckId = deckId;

    if (deckId) {
      const { error } = await supabase
        .from("decks")
        .update({
          name: deckName.trim(),
          raw_decklist: rawDecklist
        })
        .eq("id", deckId)
        .eq("user_email", user.email);

      if (error) {
        setSaving(false);
        setMessage(`Could not update deck: ${error.message}`);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("decks")
        .insert({
          user_email: user.email,
          name: deckName.trim(),
          raw_decklist: rawDecklist
        })
        .select("id")
        .single();

      if (error) {
        setSaving(false);
        setMessage(`Could not create deck: ${error.message}`);
        return;
      }

      savedDeckId = data.id;
      setDeckId(savedDeckId);
    }

    const { error: deleteError } = await supabase
      .from("deck_cards")
      .delete()
      .eq("deck_id", savedDeckId);

    if (deleteError) {
      setSaving(false);
      setMessage(`Deck saved, but old card rows could not be replaced: ${deleteError.message}`);
      return;
    }

    const rows = items.map(item => ({
      deck_id: savedDeckId,
      card_id: item.card.id,
      quantity: Math.max(1, Number(item.quantity || 1)),
      owned_quantity: Math.max(0, Number(item.ownedQuantity || 0)),
      section: item.section || "other"
    }));

    const { error: insertError } = await supabase.from("deck_cards").insert(rows);
    setSaving(false);

    if (insertError) {
      setMessage(`Deck saved, but card rows failed to save: ${insertError.message}`);
      return;
    }

    setMessage("Deck saved.");
    await loadSavedDecks();
    await openDeck(savedDeckId);
  }

  async function deleteDeck() {
    if (!deckId) return;
    if (!window.confirm(`Delete "${deckName}"?`)) return;

    const { error } = await supabase
      .from("decks")
      .delete()
      .eq("id", deckId)
      .eq("user_email", user.email);

    if (error) {
      setMessage(`Could not delete deck: ${error.message}`);
      return;
    }

    newDeck();
    await loadSavedDecks();
  }

  const totals = useMemo(() => {
    let required = 0;
    let deckOwned = 0;
    let collectionCount = 0;
    let needed = 0;

    for (const item of items) {
      const qty = Math.max(0, Number(item.quantity || 0));
      const own = Math.min(qty, Math.max(0, Number(item.ownedQuantity || 0)));
      const collection = item.card?.id ? Number(collectionOwned[item.card.id] || 0) : 0;
      const usableCollection = includeCollectionCards
        ? Math.min(collection, Math.max(0, qty - own))
        : 0;

      required += qty;
      deckOwned += own;
      collectionCount += usableCollection;
      needed += Math.max(0, qty - own - usableCollection);
    }

    return { required, deckOwned, collectionCount, needed };
  }, [items, collectionOwned, includeCollectionCards]);

  const groupedItems = useMemo(() => {
    const order = ["pokemon", "trainer", "energy", "other"];
    return order
      .map(section => ({ section, items: items.filter(item => item.section === section) }))
      .filter(group => group.items.length > 0);
  }, [items]);

  if (!user) {
    return <div className="p-4 text-white">Please log in to build and save decks.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold">Deck Builder</h2>
            <p className="text-sm text-gray-400 mt-1">
              Paste a Limitless/PTCGL deck list, compare legal H+ printings, then edit and save your checklist.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={newDeck} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">
              New Deck
            </button>
            <button
              onClick={saveDeck}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Deck"}
            </button>
            {deckId && (
              <button onClick={deleteDeck} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600">
                Delete
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm">{message}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-fit">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">My Decks</h3>
              {loadingDecks && <span className="text-xs text-gray-500">Loading…</span>}
            </div>

            <div className="space-y-2">
              {savedDecks.length === 0 && !loadingDecks && (
                <p className="text-sm text-gray-500">No saved decks yet.</p>
              )}

              {savedDecks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => openDeck(deck.id)}
                  className={`w-full text-left rounded-lg px-3 py-2 border ${
                    deck.id === deckId
                      ? "bg-blue-900/40 border-blue-600"
                      : "bg-gray-950 border-gray-800 hover:border-gray-600"
                  }`}
                >
                  <div className="font-semibold truncate">{deck.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {deck.created_at ? new Date(deck.created_at).toLocaleDateString() : ""}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="space-y-6">
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-300">Deck name</label>
                <input
                  value={deckName}
                  onChange={event => setDeckName(event.target.value)}
                  placeholder="e.g. Dragapult ex"
                  className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-300">Limitless / PTCGL deck list</label>
                <textarea
                  value={rawDecklist}
                  onChange={event => setRawDecklist(event.target.value)}
                  placeholder={EMPTY_IMPORT}
                  rows={12}
                  className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <button
                  onClick={handleParse}
                  disabled={parsing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                >
                  {parsing ? "Resolving cards..." : "Parse / Replace Checklist"}
                </button>

                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCollectionCards}
                    onChange={event => setIncludeCollectionCards(event.target.checked)}
                  />
                  Include collection cards when calculating what I still need
                </label>
              </div>

              <p className="text-xs text-gray-500">
                Standard legality filter: regulation mark {MIN_LEGAL_REGULATION_MARK} or higher. Alternative printings are never selected automatically.
              </p>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Required" value={totals.required} />
              <Stat label="Deck-owned" value={totals.deckOwned} />
              <Stat label="From collection" value={includeCollectionCards ? totals.collectionCount : 0} />
              <Stat label="Still needed" value={totals.needed} strong />
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h3 className="font-bold mb-3">Add a legal card manually</h3>
              <div className="flex gap-2">
                <input
                  value={manualSearch}
                  onChange={event => setManualSearch(event.target.value)}
                  onKeyDown={event => event.key === "Enter" && searchCards()}
                  placeholder="Search card name..."
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2"
                />
                <button onClick={searchCards} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>

              {manualResults.length > 0 && (
                <div className="mt-3 max-h-80 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                  {manualResults.map(card => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg p-2"
                    >
                      <button type="button" onClick={() => setPreviewCard(card)} className="shrink-0">
                        <img
                          src={card.image_small || card.image_large}
                          alt={card.name}
                          className="w-10 h-14 object-contain hover:opacity-80"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{card.name}</div>
                        <div className="text-xs text-gray-400">
                          {card.set_code} #{getDisplayCardNumber(card)} · Reg {card.regulation_mark || "—"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addManualCard(card)}
                        className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {items.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
                Paste a deck list above and click <strong>Parse / Replace Checklist</strong>.
              </div>
            ) : (
              groupedItems.map(group => (
                <section key={group.section} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{sectionLabel(group.section)}</h3>
                    <span className="text-xs text-gray-400">
                      {group.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} cards
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map(item => (
                      <DeckCardRow
                        key={item.key}
                        item={item}
                        collectionOwned={Number(item.card?.id ? collectionOwned[item.card.id] || 0 : 0)}
                        includeCollectionCards={includeCollectionCards}
                        onUpdate={changes => updateItem(item.key, changes)}
                        onRemove={() => removeItem(item.key)}
                        onChooseCandidate={cardId => chooseCandidate(item.key, cardId)}
                        onPreview={card => setPreviewCard(card)}
                        onChangePrinting={() => openPrintingPicker(item)}
                        loadingAlternatives={loadingAlternatives}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>
        </div>
      </div>

      {previewCard && (
        <CardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />
      )}

      {printingPicker && (
        <PrintingPickerModal
          picker={printingPicker}
          onClose={() => setPrintingPicker(null)}
          onPreview={card => setPreviewCard(card)}
          onSelect={selectPrinting}
        />
      )}
    </div>
  );
}

function Stat({ label, value, strong = false }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        strong ? "border-red-700 bg-red-950/30" : "border-gray-800 bg-gray-900"
      }`}
    >
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function DeckCardRow({
  item,
  collectionOwned,
  includeCollectionCards,
  onUpdate,
  onRemove,
  onChooseCandidate,
  onPreview,
  onChangePrinting,
  loadingAlternatives
}) {
  const quantity = Math.max(1, Number(item.quantity || 1));
  const deckOwned = Math.min(quantity, Math.max(0, Number(item.ownedQuantity || 0)));
  const usableCollection = includeCollectionCards
    ? Math.min(collectionOwned, Math.max(0, quantity - deckOwned))
    : 0;
  const needed = Math.max(0, quantity - deckOwned - usableCollection);

  if (!item.card) {
    return (
      <div className="bg-red-950/20 border border-red-900 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-red-200">Unresolved: {item.rawLine || item.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {item.candidates.length
                ? `Choose a legal regulation ${MIN_LEGAL_REGULATION_MARK}+ printing. Click an image to compare it at full size.`
                : "No legal matching printing was found in the cards table."}
            </div>
          </div>
          <button onClick={onRemove} className="text-xs px-3 py-1 rounded bg-red-800 hover:bg-red-700">
            Remove
          </button>
        </div>

        {item.candidates.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {item.candidates.map(card => (
              <div key={card.id} className="bg-gray-950 border border-gray-800 rounded-lg p-2">
                <button type="button" onClick={() => onPreview(card)} className="w-full">
                  <img
                    src={card.image_small || card.image_large}
                    alt={card.name}
                    className="w-full aspect-[2.5/3.5] object-contain"
                  />
                </button>
                <div className="text-xs mt-2">
                  <div className="font-semibold truncate">{card.set_code} #{getDisplayCardNumber(card)}</div>
                  <div className="text-gray-500">Reg {card.regulation_mark || "—"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onChooseCandidate(card.id)}
                  className="mt-2 w-full text-xs px-2 py-1.5 rounded bg-blue-700 hover:bg-blue-600"
                >
                  Use this printing
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="flex flex-col md:flex-row gap-4">
        <button type="button" onClick={() => onPreview(item.card)} className="self-center md:self-start shrink-0">
          <img
            src={item.card.image_small || item.card.image_large}
            alt={item.card.name}
            className="w-20 h-28 object-contain hover:opacity-80"
          />
          <span className="block text-[10px] text-gray-500 mt-1">View larger</span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className="font-bold text-lg">{item.card.name}</h4>
              <p className="text-sm text-gray-400">
                {item.card.set_code} #{getDisplayCardNumber(item.card)} · {item.card.rarity || "Unknown rarity"} · Reg {item.card.regulation_mark || "—"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onChangePrinting}
                disabled={loadingAlternatives}
                className="self-start text-xs px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAlternatives ? "Loading…" : "Other legal printings"}
              </button>
              <button onClick={onRemove} className="self-start text-xs px-3 py-1 rounded bg-red-800 hover:bg-red-700">
                Remove
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <Counter
              label="Required"
              value={quantity}
              min={1}
              onChange={value => onUpdate({ quantity: value, ownedQuantity: Math.min(deckOwned, value) })}
            />
            <Counter
              label="Deck-owned"
              value={deckOwned}
              min={0}
              max={quantity}
              onChange={value => onUpdate({ ownedQuantity: value })}
            />
            <div className="rounded-lg bg-gray-950 border border-gray-800 p-3">
              <div className="text-xs text-gray-500">Collection copies</div>
              <div className="font-bold mt-1">{collectionOwned}</div>
            </div>
          </div>

          <div
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              needed === 0 ? "bg-green-950/40 text-green-300" : "bg-yellow-950/40 text-yellow-200"
            }`}
          >
            {needed === 0 ? <strong>Complete</strong> : <strong>Still need {needed}</strong>}
            {includeCollectionCards && usableCollection > 0 && (
              <span className="ml-2 text-gray-300">({usableCollection} counted from collection)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardPreviewModal({ card, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-xl w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-gray-950/90 hover:bg-gray-800 text-xl"
        >
          ×
        </button>

        <img
          src={card.image_large || card.image_small}
          alt={card.name}
          className="max-h-[78vh] w-full object-contain rounded-xl"
        />

        <div className="mt-3 text-center">
          <div className="font-bold text-lg">{card.name}</div>
          <div className="text-sm text-gray-400">
            {card.set_code} #{getDisplayCardNumber(card)} · {card.rarity || "Unknown rarity"} · Regulation {card.regulation_mark || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintingPickerModal({ picker, onClose, onPreview, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[90] bg-black/75 flex items-center justify-center p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Legal printings: {picker.cardName}</h3>
            <p className="text-xs text-gray-400 mt-1">
              Showing regulation mark {MIN_LEGAL_REGULATION_MARK} or higher. Preview the cards before replacing the deck printing.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-white">×</button>
        </div>

        <div className="p-4 overflow-auto">
          {picker.cards.length === 0 ? (
            <div className="text-gray-400">No other legal printings were found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {picker.cards.map(card => {
                const current = card.id === picker.currentCardId;
                return (
                  <div
                    key={card.id}
                    className={`rounded-xl border p-2 ${
                      current ? "border-green-500 bg-green-950/20" : "border-gray-800 bg-gray-950"
                    }`}
                  >
                    <button type="button" onClick={() => onPreview(card)} className="w-full">
                      <img
                        src={card.image_small || card.image_large}
                        alt={card.name}
                        className="w-full aspect-[2.5/3.5] object-contain"
                      />
                    </button>
                    <div className="mt-2 text-sm font-semibold">
                      {card.set_code} #{getDisplayCardNumber(card)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {card.rarity || "Unknown rarity"} · Reg {card.regulation_mark || "—"}
                    </div>
                    <button
                      type="button"
                      disabled={current}
                      onClick={() => onSelect(card)}
                      className={`mt-2 w-full text-xs px-2 py-2 rounded ${
                        current
                          ? "bg-green-900/50 text-green-300 cursor-default"
                          : "bg-blue-700 hover:bg-blue-600"
                      }`}
                    >
                      {current ? "Current printing" : "Use this printing"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value, min = 0, max = 99, onChange }) {
  function set(next) {
    const numeric = Number(next);
    const safe = Number.isFinite(numeric) ? numeric : min;
    const clamped = Math.max(min, Math.min(max, safe));
    onChange(clamped);
  }

  return (
    <div className="rounded-lg bg-gray-950 border border-gray-800 p-3">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => set(value - 1)} className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600">−</button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={event => set(event.target.value)}
          className="w-14 text-center bg-gray-900 border border-gray-700 rounded h-8"
        />
        <button onClick={() => set(value + 1)} className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600">+</button>
      </div>
    </div>
  );
}
