import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getVariants } from "../utils/cardUtils";
import { SET_CONFIG } from "../utils/setConfig";

const VARIANT_LABELS = {
  normal: "Normal",
  holo: "Holo",
  reverse: "Reverse",
  pokeball: "Poké Ball",
  masterball: "Master Ball"
};

function formatVariant(variant) {
  return (
    VARIANT_LABELS[variant] ||
    String(variant || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase())
  );
}

function getDisplayNumber(card) {
  const id = String(card?.id || "").trim();
  const setCode = String(card?.set_code || "").trim();

  if (!id) return String(card?.number ?? "");

  const prefix = setCode ? `${setCode}-` : "";

  if (prefix && id.toLowerCase().startsWith(prefix.toLowerCase())) {
    return id.substring(prefix.length);
  }

  const dashIndex = id.indexOf("-");
  return dashIndex >= 0 ? id.substring(dashIndex + 1) : String(card?.number ?? "");
}

function compareCards(a, b) {
  const numberA = Number(a.number || 0);
  const numberB = Number(b.number || 0);

  if (numberA !== numberB) return numberA - numberB;

  return getDisplayNumber(a).localeCompare(getDisplayNumber(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function MissingCard({ card, missingVariants }) {
  return (
    <article className="needed-card bg-gray-800 border border-gray-700 rounded-xl overflow-hidden break-inside-avoid">
      <div className="needed-card-image-wrap bg-gray-900 flex items-center justify-center p-2">
        <img
          src={card.image_small || card.image_large}
          alt={card.name}
          className="needed-card-image w-full h-auto object-contain"
          loading="lazy"
        />
      </div>

      <div className="needed-card-details p-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm leading-tight text-white">{card.name}</h4>
          <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
            #{getDisplayNumber(card)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {missingVariants.map(variant => (
            <span
              key={variant}
              className="needed-variant inline-flex px-2 py-1 rounded-full bg-red-950/70 border border-red-800 text-red-200 text-[11px] font-semibold"
            >
              {formatVariant(variant)}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function NeededCardsPage({ user }) {
  const [collections, setCollections] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [cardsBySet, setCardsBySet] = useState({});
  const [userCards, setUserCards] = useState({});
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [loadingRules, setLoadingRules] = useState([]);
  const [error, setError] = useState("");

  const [selectedVariant, setSelectedVariant] = useState("all");
  const [hideNormalOnly, setHideNormalOnly] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setCollections([]);
      setSelectedRules([]);
      setCardsBySet({});
      setUserCards({});
      setLoadingCollections(false);
      return;
    }

    let cancelled = false;

    async function loadCollections() {
      setLoadingCollections(true);
      setError("");

      try {
        const { data: links, error: linksError } = await supabase
          .from("user_collections")
          .select("collection_id")
          .eq("email", user.email);

        if (linksError) throw linksError;

        const collectionIds = [...new Set((links || []).map(row => row.collection_id))];

        if (collectionIds.length === 0) {
          if (!cancelled) {
            setCollections([]);
            setSelectedRules([]);
          }
          return;
        }

        const { data: collectionRows, error: collectionsError } = await supabase
          .from("collections")
          .select("*")
          .in("id", collectionIds);

        if (collectionsError) throw collectionsError;

        const setCollections = (collectionRows || [])
          .filter(collection => collection.type === "set_code")
          .filter((collection, index, list) => {
            const rule = String(collection.rule || "").trim().toLowerCase();
            return (
              rule &&
              index ===
                list.findIndex(item =>
                  String(item.rule || "").trim().toLowerCase() === rule
                )
            );
          })
          .sort((a, b) => {
            const ruleA = String(a.rule || "").trim().toLowerCase();
            const ruleB = String(b.rule || "").trim().toLowerCase();
            const dateA = SET_CONFIG[ruleA]?.releaseDate || "1900-01-01";
            const dateB = SET_CONFIG[ruleB]?.releaseDate || "1900-01-01";
            return new Date(dateB) - new Date(dateA);
          });

        if (!cancelled) {
          setCollections(setCollections);

          // Default to the newest linked set only.
          const newestRule = setCollections[0]
            ? String(setCollections[0].rule || "").trim().toLowerCase()
            : "";

          setSelectedRules(newestRule ? [newestRule] : []);
        }
      } catch (loadError) {
        console.error("Error loading Needed Cards collections:", loadError);
        if (!cancelled) {
          setError(loadError.message || "Could not load your collections.");
        }
      } finally {
        if (!cancelled) setLoadingCollections(false);
      }
    }

    loadCollections();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email || selectedRules.length === 0) return;

    const rulesToLoad = selectedRules.filter(rule => !cardsBySet[rule]);
    if (rulesToLoad.length === 0) return;

    let cancelled = false;

    async function loadSelectedSets() {
      setError("");
      setLoadingRules(current => [...new Set([...current, ...rulesToLoad])]);

      try {
        const newCardsBySet = {};
        const newOwnership = {};

        for (const rule of rulesToLoad) {
          const { data: cards, error: cardsError } = await supabase
            .from("cards")
            .select("*")
            .eq("set_code", rule)
            .order("number", { ascending: true })
            .range(0, 10000);

          if (cardsError) throw cardsError;

          const sortedCards = [...(cards || [])].sort(compareCards);
          newCardsBySet[rule] = sortedCards;

          const cardIds = sortedCards.map(card => card.id).filter(Boolean);
          const chunkSize = 250;

          for (let i = 0; i < cardIds.length; i += chunkSize) {
            const chunk = cardIds.slice(i, i + chunkSize);

            const { data: ownershipRows, error: ownershipError } = await supabase
              .from("user_cards")
              .select("card_id, variant, owned")
              .eq("email", user.email)
              .in("card_id", chunk)
              .range(0, 10000);

            if (ownershipError) throw ownershipError;

            (ownershipRows || []).forEach(item => {
              newOwnership[`${item.card_id}_${item.variant}`] = Number(item.owned || 0);
            });
          }
        }

        if (!cancelled) {
          setCardsBySet(current => ({ ...current, ...newCardsBySet }));
          setUserCards(current => ({ ...current, ...newOwnership }));
        }
      } catch (loadError) {
        console.error("Error loading Needed Cards set data:", loadError);
        if (!cancelled) {
          setError(loadError.message || "Could not load the selected set(s).");
        }
      } finally {
        if (!cancelled) {
          setLoadingRules(current => current.filter(rule => !rulesToLoad.includes(rule)));
        }
      }
    }

    loadSelectedSets();

    return () => {
      cancelled = true;
    };
  }, [selectedRules, user?.email, cardsBySet]);

  const selectedRuleSet = useMemo(() => new Set(selectedRules), [selectedRules]);

  const groupedMissing = useMemo(() => {
    return collections
      .filter(collection => {
        const rule = String(collection.rule || "").trim().toLowerCase();
        return selectedRuleSet.has(rule);
      })
      .map(collection => {
        const rule = String(collection.rule || "").trim().toLowerCase();
        const setConfig = SET_CONFIG[rule];
        const cards = cardsBySet[rule] || [];

        const missingCards = cards
          .map(card => {
            const requiredVariants = getVariants(card, "master");
            const missingVariants = requiredVariants.filter(variant => {
              const key = `${card.id}_${variant}`;
              return Number(userCards[key] || 0) <= 0;
            });

            return { card, missingVariants };
          })
          .filter(item => item.missingVariants.length > 0)
          .filter(item =>
            selectedVariant === "all"
              ? true
              : item.missingVariants.includes(selectedVariant)
          )
          .filter(item => {
            if (!hideNormalOnly) return true;
            return !(
              item.missingVariants.length === 1 && item.missingVariants[0] === "normal"
            );
          });

        return {
          collection,
          rule,
          name: setConfig?.name || collection.name || rule,
          releaseDate: setConfig?.releaseDate || "",
          missingCards,
          totalMissingVariants: missingCards.reduce(
            (sum, item) => sum + item.missingVariants.length,
            0
          )
        };
      })
      .filter(group => group.missingCards.length > 0);
  }, [collections, cardsBySet, userCards, selectedRuleSet, selectedVariant, hideNormalOnly]);

  const availableVariants = useMemo(() => {
    const variants = new Set();

    selectedRules.forEach(rule => {
      (cardsBySet[rule] || []).forEach(card => {
        getVariants(card, "master").forEach(variant => variants.add(variant));
      });
    });

    return [...variants].sort((a, b) =>
      formatVariant(a).localeCompare(formatVariant(b))
    );
  }, [selectedRules, cardsBySet]);

  const totalCardsNeeded = groupedMissing.reduce(
    (sum, group) => sum + group.missingCards.length,
    0
  );

  const totalVariantsNeeded = groupedMissing.reduce(
    (sum, group) => sum + group.totalMissingVariants,
    0
  );

  const isLoadingSelected = selectedRules.some(rule => loadingRules.includes(rule));

  function toggleSet(rule) {
    setSelectedRules(current =>
      current.includes(rule)
        ? current.filter(item => item !== rule)
        : [...current, rule]
    );
  }

  function selectNewestOnly() {
    const newest = collections[0];
    if (!newest) return;
    const rule = String(newest.rule || "").trim().toLowerCase();
    setSelectedRules(rule ? [rule] : []);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        Please log in to view your needed cards.
      </div>
    );
  }

  return (
    <div className="needed-cards-page min-h-screen bg-gray-950 text-white p-4 md:p-6">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; }
          header, footer, .needed-screen-only { display: none !important; }
          .needed-cards-page { background: white !important; color: black !important; padding: 0 !important; min-height: auto !important; }
          .needed-print-header { display: block !important; color: black !important; margin-bottom: 8mm; }
          .needed-set-section { break-before: auto; margin-bottom: 8mm !important; }
          .needed-set-heading { color: black !important; border-bottom: 2px solid #111 !important; padding-bottom: 2mm !important; margin-bottom: 4mm !important; }
          .needed-set-heading p, .needed-set-heading span { color: #444 !important; }
          .needed-grid { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 4mm !important; }
          .needed-card { background: white !important; border: 1px solid #aaa !important; border-radius: 3mm !important; overflow: hidden !important; break-inside: avoid !important; page-break-inside: avoid !important; }
          .needed-card-image-wrap { background: white !important; padding: 2mm !important; }
          .needed-card-image { width: 100% !important; max-height: 54mm !important; object-fit: contain !important; }
          .needed-card-details { padding: 2mm !important; }
          .needed-card-details h4 { color: black !important; font-size: 8pt !important; }
          .needed-card-details > div > span { color: #444 !important; font-size: 7pt !important; }
          .needed-variant { background: white !important; border: 1px solid #333 !important; color: black !important; font-size: 6.5pt !important; padding: 0.5mm 1.2mm !important; }
        }
      `}</style>

      <div className="needed-print-header hidden">
        <h1 className="text-2xl font-bold">Needed Cards</h1>
        <p>{totalCardsNeeded} cards • {totalVariantsNeeded} variants needed</p>
      </div>

      <div className="needed-screen-only max-w-7xl mx-auto mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Needed Cards</h2>
            <p className="text-gray-400 text-sm mt-1">
              Select the sets you want to load. The newest linked set is selected by default.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={loadingCollections || isLoadingSelected || totalCardsNeeded === 0}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 font-semibold transition"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="mt-5 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold">Sets to include</h3>
              <p className="text-xs text-gray-400 mt-1">
                Checking a set loads its cards and your ownership data. Loaded sets are cached for this visit.
              </p>
            </div>

            <button
              type="button"
              onClick={selectNewestOnly}
              className="px-3 py-2 text-sm rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
            >
              Newest set only
            </button>
          </div>

          {loadingCollections ? (
            <p className="text-sm text-gray-400">Loading collections…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {collections.map(collection => {
                const rule = String(collection.rule || "").trim().toLowerCase();
                const setConfig = SET_CONFIG[rule];
                const checked = selectedRules.includes(rule);
                const loading = loadingRules.includes(rule);

                return (
                  <label
                    key={collection.id || rule}
                    className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSet(rule)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {setConfig?.name || collection.name || rule}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {rule}
                        {setConfig?.releaseDate ? ` • ${setConfig.releaseDate}` : ""}
                        {loading ? " • Loading…" : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <label className="text-sm">
            <span className="block text-gray-400 mb-1">Missing variant</span>
            <select
              value={selectedVariant}
              onChange={event => setSelectedVariant(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All variants</option>
              {availableVariants.map(variant => (
                <option key={variant} value={variant}>
                  {formatVariant(variant)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm md:self-end min-h-[42px]">
            <input
              type="checkbox"
              checked={hideNormalOnly}
              onChange={event => setHideNormalOnly(event.target.checked)}
              className="h-4 w-4"
            />
            <span>Hide cards needing only Normal</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400">Cards needed:</span> <strong>{totalCardsNeeded}</strong>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400">Variants needed:</span> <strong>{totalVariantsNeeded}</strong>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400">Sets selected:</span> <strong>{selectedRules.length}</strong>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto space-y-10">
        {error ? (
          <div className="needed-screen-only bg-red-950/50 border border-red-800 text-red-200 rounded-xl p-4">
            {error}
          </div>
        ) : selectedRules.length === 0 ? (
          <div className="needed-screen-only bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-lg font-semibold">Select at least one set.</p>
          </div>
        ) : isLoadingSelected ? (
          <div className="needed-screen-only text-center text-gray-400 py-16">
            Loading selected set…
          </div>
        ) : groupedMissing.length === 0 ? (
          <div className="needed-screen-only bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-lg font-semibold">No needed cards match these filters.</p>
            <p className="text-gray-400 text-sm mt-1">
              The selected set may be complete, or the current filters may hide the remaining cards.
            </p>
          </div>
        ) : (
          groupedMissing.map(group => (
            <section key={group.rule} className="needed-set-section">
              <div className="needed-set-heading flex items-end justify-between gap-4 border-b border-gray-700 pb-3 mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{group.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {group.rule}
                    {group.releaseDate ? ` • ${group.releaseDate}` : ""}
                  </p>
                </div>

                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {group.missingCards.length} cards • {group.totalMissingVariants} variants
                </span>
              </div>

              <div className="needed-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {group.missingCards.map(({ card, missingVariants }) => (
                  <MissingCard
                    key={card.id}
                    card={card}
                    missingVariants={missingVariants}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
