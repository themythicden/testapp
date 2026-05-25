import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { SET_CONFIG } from "../utils/setConfig";

function CollectionCard({ collection, onClick }) {
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

        <div className="min-w-0">
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
    </button>
  );
}

export default function CollectionsPage({ user }) {
  const [collections, setCollections] = useState([]);
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

  const setCollections = useMemo(() => {
    return collections
      .filter(c => c.type === "set_code")
      .sort((a, b) => {
        const dateA = SET_CONFIG[a.rule]?.releaseDate || "1900-01-01";
        const dateB = SET_CONFIG[b.rule]?.releaseDate || "1900-01-01";

        return new Date(dateB) - new Date(dateA);
      });
  }, [collections]);

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
    <div className="min-h-screen bg-gray-950 text-white p-4 space-y-6">
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
          {setCollections.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xl font-bold">Sets</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {setCollections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => openCollection(collection)}
                  />
                ))}
              </div>
            </section>
          )}

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
