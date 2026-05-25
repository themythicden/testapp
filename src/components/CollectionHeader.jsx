import { useState } from "react";

export default function CollectionHeader({
  collection,
  collectionName,
  cards = []
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (!collection) {
    return (
      <h2 className="text-2xl p-4 text-white">
        {collectionName || "Collection"}
      </h2>
    );
  }

  const isSetCollection = collection.type === "set_code";
  const isPokemonCollection = collection.type === "pokemon";

  const setLogoUrl = isSetCollection
    ? `https://images.scrydex.com/pokemon/${collection.rule}-logo/logo`
    : null;

  const pokemonImage =
    isPokemonCollection && cards.length > 0
      ? cards[0]?.image_small || cards[0]?.image_large
      : null;

  return (
    <div className="flex justify-center">
      <div className="bg-gray-900 p-4 w-full flex justify-center items-center">
        {isSetCollection && !logoFailed ? (
          <img
            src={setLogoUrl}
            alt={collectionName || collection.name}
            onError={() => setLogoFailed(true)}
            className="max-h-24 object-contain"
          />
        ) : isPokemonCollection && pokemonImage ? (
          <div className="flex items-center gap-4">
            <img
              src={pokemonImage}
              alt={collection.rule}
              className="h-28 rounded-lg"
            />

            <h2 className="text-2xl font-bold text-white capitalize">
              {collectionName || collection.rule}
            </h2>
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-white text-center">
            {collectionName || collection.name || "Collection"}
          </h2>
        )}
      </div>
    </div>
  );
}
