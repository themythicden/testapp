import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getVariants } from "../utils/cardUtils";
import { getDisplayCardNumber } from "../utils/getDisplayCardNumber";
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

function compareCards(a, b) {
  const numberA = Number(a.number || 0);
  const numberB = Number(b.number || 0);

  if (numberA !== numberB) return numberA - numberB;

  return getDisplayCardNumber(a).localeCompare(
    getDisplayCardNumber(b),
    undefined,
    { numeric: true, sensitivity: "base" }
  );
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
          <h4 className="font-bold text-sm leading-tight text-white">
            {card.name}
          </h4>
          <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
            #{getDisplayCardNumber(card)}
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
  const [cardsBySet, setCardsBySet] = useState({});
  const [userCards, setUserCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedSet, setSelectedSet] = useState("all");
  const [selectedVariant, setSelectedVariant] = useState("all");
  const [hideNormalOnly, setHideNormalOnly] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setCollections([]);
      setCardsBySet({});
      setUserCards({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadNeededData() {
      setLoading(true);
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
            setCardsBySet({});
            setUserCards({});
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
            const normalizedRule = String(collection.rule || "").trim().toLowerCase();
            return (
              index ===
              list.findIndex(item =>
                String(item.rule || "").trim().toLowerCase() === normalizedRule
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

        const nextCardsBySet = {};
        const allCardIds = [];

        for (const collection of setCollections) {
          const rule = String(collection.rule || "").trim().toLowerCase();

          const { data: cards, error: cardsError } = await supabase
            .from("cards")
            .select("*")
            .eq("set_code", rule)
            .order("number", { ascending: true })
            .range(0, 10000);

          if (cardsError) {
            console.error("Error loading needed cards for set:", rule, cardsError);
            continue;
          }

          const sortedCards = [...(cards || [])].sort(compareCards);
          nextCardsBySet[rule] = sortedCards;
          sortedCards.forEach(card => allCardIds.push(card.id));
        }

        const nextUserCards = {};
        const uniqueCardIds = [...new Set(allCardIds)];

        // Fetch in chunks so larger libraries do not create an oversized URL.
        const chunkSize = 250;
        for (let i = 0; i < uniqueCardIds.length; i += chunkSize) {
          const chunk = uniqueCardIds.slice(i, i + chunkSize);

          const { data: ownershipRows, error: ownershipError } = await supabase
            .from("user_cards")
            .select("card_id, variant, owned")
            .eq("email", user.email)
            .in("card_id", chunk)
            .range(0, 10000);

          if (ownershipError) throw ownershipError;

          (ownershipRows || []).forEach(item => {
            const key = `${item.card_id}_${item.variant}`;
            nextUserCards[key] = Number(item.owned || 0);
          });
        }

        if (!cancelled) {
          setCollections(setCollections);
          setCardsBySet(nextCardsBySet);
          setUserCards(nextUserCards);
        }
      } catch (loadError) {
        console.error("Error loading Needed Cards page:", loadError);
        if (!cancelled) {
          setError(loadError.message || "Could not load needed cards.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNeededData();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const groupedMissing = useMemo(() => {
    return collections
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

            return {
              card,
              missingVariants
            };
          })
          .filter(item => item.missingVariants.length > 0)
          .filter(item => {
            if (selectedVariant !== "all") {
              return item.missingVariants.includes(selectedVariant);
            }
            return true;
          })
          .filter(item => {
            if (!hideNormalOnly) return true;
            return !(
              item.missingVariants.length === 1 &&
              item.missingVariants[0] === "normal"
            );
          });

        const totalMissingVariants = missingCards.reduce(
          (sum, item) => sum + item.missingVariants.length,
          0
        );

        return {
          collection,
          rule,
          name: setConfig?.name || collection.name || rule,
          releaseDate: setConfig?.releaseDate || "",
          missingCards,
          totalMissingVariants
        };
      })
      .filter(group => selectedSet === "all" || group.rule === selectedSet)
      .filter(group => group.missingCards.length > 0);
  }, [collections, cardsBySet, userCards, selectedSet, selectedVariant, hideNormalOnly]);

  const availableVariants = useMemo(() => {
    const variants = new Set();

    collections.forEach(collection => {
      const rule = String(collection.rule || "").trim().toLowerCase();
      (cardsBySet[rule] || []).forEach(card => {
        getVariants(card, "master").forEach(variant => variants.add(variant));
      });
    });

    return [...variants].sort((a, b) => formatVariant(a).localeCompare(formatVariant(b)));
  }, [collections, cardsBySet]);

  const totalCardsNeeded = groupedMissing.reduce(
    (sum, group) => sum + group.missingCards.length,
    0
  );

  const totalVariantsNeeded = groupedMissing.reduce(
    (sum, group) => sum + group.totalMissingVariants,
    0
  );

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
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          header,
          footer,
          .needed-screen-only {
            display: none !important;
          }

          .needed-cards-page {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          .needed-print-header {
            display: block !important;
            color: black !important;
            margin-bottom: 8mm;
          }

          .needed-set-section {
            break-before: auto;
            margin-bottom: 8mm !important;
          }

          .needed-set-heading {
            color: black !important;
            border-bottom: 2px solid #111 !important;
            padding-bottom: 2mm !important;
            margin-bottom: 4mm !important;
          }

          .needed-set-heading p,
          .needed-set-heading span {
            color: #444 !important;
          }

          .needed-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 4mm !important;
          }

          .needed-card {
            background: white !important;
            border: 1px solid #aaa !important;
            border-radius: 3mm !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .needed-card-image-wrap {
            background: white !important;
            padding: 2mm !important;
          }

          .needed-card-image {
            width: 100% !important;
            max-height: 54mm !important;
            object-fit: contain !important;
          }

          .needed-card-details {
            padding: 2mm !important;
          }

          .needed-card-details h4 {
            color: black !important;
            font-size: 8pt !important;
          }

          .needed-card-details > div > span {
            color: #444 !important;
            font-size: 7pt !important;
          }

          .needed-variant {
            background: white !important;
            border: 1px solid #333 !important;
            color: black !important;
            font-size: 6.5pt !important;
            padding: 0.5mm 1.2mm !important;
          }
        }
      `}</style>

      <div className="needed-print-header hidden">
        <h1 className="text-2xl font-bold">Needed Cards</h1>
        <p>
          {totalCardsNeeded} cards • {totalVariantsNeeded} variants needed
        </p>
      </div>

      <div className="needed-screen-only max-w-7xl mx-auto mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Needed Cards</h2>
            <p className="text-gray-400 text-sm mt-1">
              A read-only list of the cards and variants you still need, grouped by set.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || totalCardsNeeded === 0}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 font-semibold transition"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <label className="text-sm">
            <span className="block text-gray-400 mb-1">Set</span>
            <select
              value={selectedSet}
              onChange={event => setSelectedSet(event.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All sets</option>
              {collections.map(collection => {
                const rule = String(collection.rule || "").trim().toLowerCase();
                return (
                  <option key={collection.id || rule} value={rule}>
                    {SET_CONFIG[rule]?.name || collection.name || rule}
                  </option>
                );
              })}
            </select>
          </label>

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
            <span className="text-gray-400">Cards needed:</span>{" "}
            <strong>{totalCardsNeeded}</strong>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400">Variants needed:</span>{" "}
            <strong>{totalVariantsNeeded}</strong>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-400">Sets shown:</span>{" "}
            <strong>{groupedMissing.length}</strong>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto space-y-10">
        {loading ? (
          <div className="needed-screen-only text-center text-gray-400 py-16">
            Loading needed cards…
          </div>
        ) : error ? (
          <div className="needed-screen-only bg-red-950/50 border border-red-800 text-red-200 rounded-xl p-4">
            {error}
          </div>
        ) : groupedMissing.length === 0 ? (
          <div className="needed-screen-only bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
            <p className="text-lg font-semibold">No needed cards match these filters.</p>
            <p className="text-gray-400 text-sm mt-1">
              Either the selected collections are complete or the filters are hiding the remaining cards.
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
