import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { SET_CONFIG } from "../utils/setConfig";
import { getCollectionCompletion } from "../utils/completionUtils";

function ProgressBar({ percentage }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>My Progress</span>
        <span>{percentage}%</span>
      </div>

      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CollectionCard({ collection, onClick, completion }) {
  const isSet = collection.type === "set_code";
  const isPokemon = collection.type === "pokemon";
  const setConfig = SET_CONFIG[collection.rule];

  const logoUrl = isSet
    ? `https://images.scrydex.com/pokemon/${collection.rule}-logo/logo`
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-left hover:bg-gray-700 transition"
    >
      <div className="flex items-center gap-4">
        <div className="w-24 h-16 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
          {isSet ? (
            <img
              src={logoUrl}
              alt={collection.name}
              className="max-w-full max-h-full object-contain"
              onError={e => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : isPokemon ? (
            <span className="text-3xl">⭐</span>
          ) : (
            <span className="text-3xl">📁</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-white font-bold text-lg truncate">
            {collection.name}
          </h3>

          <p className="text-gray-400 text-sm">
            {isSet
              ? setConfig?.name || collection.rule
              : isPokemon
                ? `Pokémon: ${collection.rule}`
                : collection.type || "Collection"}
          </p>

          {isSet && setConfig?.releaseDate && (
            <p className="text-gray-500 text-xs mt-1">
              Released: {setConfig.releaseDate}
            </p>
          )}
        </div>
      </div>

      {completion && (
        <>
          <ProgressBar percentage={completion.percentage} />

          <p className="text-xs text-gray-400 mt-2">
            {completion.owned} / {completion.total} collected
          </p>
        </>
      )}
    </button>
  );
}

export default function CollectionsPage({ user }) {
  const [collections, setCollections] = useState([]);
  const [cardsBySet, setCardsBySet] = useState({});
  const [completionMap, setCompletionMap] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.email) return;

    async function loadCollections() {
      const { data: userCollections, error } = await supabase
        .from("user_collections")
        .select("collection_id")
        .eq("email", user.email);

      if (error) {
        console.error("Error loading user collections:", error);
        return;
      }

      const ids = (userCollections || []).map(row => row.collection_id);

      if (!ids.length) {
        setCollections([]);
        setCardsBySet({});
        setCompletionMap({});
        return;
      }

      const { data: collectionsData, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .in("id", ids);

      if (collectionsError) {
        console.error("Error loading collections:", collectionsError);
        return;
      }

      setCollections(collectionsData || []);
    }

    loadCollections();
  }, [user?.email]);

  // Load cards PER SET instead of one large .in("set_code") query
  useEffect(() => {
    async function loadCardsForCollections() {
      const setCollections = collections.filter(c => c.type === "set_code");

      if (setCollections.length === 0) {
        setCardsBySet({});
        return;
      }

      const grouped = {};

      for (const collection of setCollections) {
        const { data, error } = await supabase
          .from("cards")
          .select("*")
          .eq("set_code", collection.rule)
          .order("number", { ascending: true })
          .range(0, 10000);

        if (error) {
          console.error("Error loading cards for set:", collection.rule, error);
          continue;
        }

        grouped[collection.rule] = data || [];

        console.log("CARDS LOADED FOR SET:", {
          set: collection.rule,
          count: data?.length || 0
        });
      }

      setCardsBySet(grouped);
    }

    loadCardsForCollections();
  }, [collections]);

  // Build completion PER COLLECTION using only that collection's cards
  useEffect(() => {
    async function loadCompletions() {
      if (!user?.email) return;

      const map = {};

      for (const collection of collections) {
        if (collection.type !== "set_code") continue;

        const cards = cardsBySet[collection.rule] || [];

        console.log("COMPLETION BUILD:", {
          collection: collection.name,
          rule: collection.rule,
          cardsFound: cards.length
        });

        if (cards.length === 0) continue;

        const cardIds = cards.map(card => card.id);

        const { data, error } = await supabase
          .from("user_cards")
          .select("*")
          .eq("email", user.email)
          .in("card_id", cardIds)
          .range(0, 10000);

        if (error) {
          console.error("Completion load error:", collection.rule, error);
          continue;
        }

        const localUserCards = {};

        (data || []).forEach(item => {
          const key = `${item.card_id}_${item.variant}`;
          localUserCards[key] = Number(item.owned || 0);
        });

        map[collection.id] = getCollectionCompletion({
          cards,
          userCards: localUserCards,
          allUserCards: {},
          collectionUsers: [],
          selectedOwnerEmails: [],
          currentUserEmail: user.email,
          isCollab: false,
          setFilter: "master",
          collection
        });
      }

      setCompletionMap(map);
    }

    loadCompletions();
  }, [collections, cardsBySet, user?.email]);

  const setCollectionsList = useMemo(() => {
    return collections
      .filter(c => c.type === "set_code")
      .sort((a, b) => {
        const dateA = SET_CONFIG[a.rule]?.releaseDate || "1900-01-01";
        const dateB = SET_CONFIG[b.rule]?.releaseDate || "1900-01-01";

        return new Date(dateB) - new Date(dateA);
      });
  }, [collections]);

  const groupedSetCollections = useMemo(() => {
    const groups = {};

    setCollectionsList.forEach(collection => {
      const series = SET_CONFIG[collection.rule]?.series || "Other Series";

      if (!groups[series]) {
        groups[series] = [];
      }

      groups[series].push(collection);
    });

    return Object.entries(groups).sort(([, collectionsA], [, collectionsB]) => {
      const newestA = collectionsA.reduce((newest, collection) => {
        const date = SET_CONFIG[collection.rule]?.releaseDate || "1900-01-01";
        return new Date(date) > new Date(newest) ? date : newest;
      }, "1900-01-01");

      const newestB = collectionsB.reduce((newest, collection) => {
        const date = SET_CONFIG[collection.rule]?.releaseDate || "1900-01-01";
        return new Date(date) > new Date(newest) ? date : newest;
      }, "1900-01-01");

      return new Date(newestB) - new Date(newestA);
    });
  }, [setCollectionsList]);

  const pokemonCollections = useMemo(() => {
    return collections
      .filter(c => c.type === "pokemon")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collections]);

  const otherCollections = useMemo(() => {
    return collections.filter(
      c => c.type !== "set_code" && c.type !== "pokemon"
    );
  }, [collections]);

  if (!user) {
    return <div className="p-4 text-white">Please log in</div>;
  }

  const openCollection = collection => {
    navigate(`/collection?id=${collection.id}&name=${collection.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold">My Collections</h2>
        <p className="text-gray-400 text-sm mt-1">
          Select a collection to view your progress.
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-gray-300">No collections found</p>
        </div>
      ) : (
        <>
          {groupedSetCollections.map(([series, seriesCollections]) => (
            <section key={series} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{series}</h3>
                <span className="text-xs text-gray-400">
                  {seriesCollections.length} collection
                  {seriesCollections.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {seriesCollections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    completion={completionMap[collection.id]}
                    onClick={() => openCollection(collection)}
                  />
                ))}
              </div>
            </section>
          ))}

          {pokemonCollections.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xl font-bold">Pokémon Collections</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {pokemonCollections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => openCollection(collection)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherCollections.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xl font-bold">Other Collections</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {otherCollections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => openCollection(collection)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
