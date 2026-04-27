import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getVariants } from "../utils/cardUtils";
import VariantRow from "../components/VariantRow";
import ISOVariantSelector from "../components/ISOVariantSelector";
import ISOConditionSelector from "../components/ISOConditionSelector";

const CONDITIONS = ["any", "nm", "lp", "mp", "hp"];

export default function ISOPage() {
  const [user, setUser] = useState(null);
  const [isoCards, setIsoCards] = useState({});
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [showISO, setShowISO] = useState(true);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedConditions, setSelectedConditions] = useState({});

  // -----------------------------
  // AUTH
  // -----------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // -----------------------------
  // LOAD ISO
  // -----------------------------
  useEffect(() => {
    async function loadISO() {
      if (!user) return;

      const { data, error } = await supabase
        .from("iso_cards")
        .select("*")
        .eq("email", user.email);

      if (error) return console.error(error);

      const map = {};

      data.forEach(item => {
        const key = `${item.card_id}_${item.variant}`;
        map[key] = Number(item.quantity || 0);
      });

      setIsoCards(map); // ✅ FIXED
    }

    loadISO();
  }, [user]);

  // -----------------------------
  // ISO ADD
  // -----------------------------
const handleISOAdd = async (cardId, variant, condition) => {
  const key = `${cardId}_${variant}_${condition}`;
  const current = isoCards[key] || 0;
  const newCount = current + 1;

  setIsoCards(prev => ({
    ...prev,
    [key]: newCount
  }));

  await supabase.from("iso_cards").upsert({
    email: user.email,
    card_id: cardId,
    variant,
    condition,
    quantity: newCount
  }, {
    onConflict: "email,card_id,variant,condition"
  });
};

  // -----------------------------
  // ISO REMOVE
  // -----------------------------
const handleISORemove = async (cardId, variant, condition) => {
  const key = `${cardId}_${variant}_${condition}`;
  const current = isoCards[key] || 0;

  if (current <= 0) return;

  const newCount = current - 1;

  setIsoCards(prev => {
    const updated = { ...prev };

    if (newCount === 0) delete updated[key];
    else updated[key] = newCount;

    return updated;
  });

  if (newCount === 0) {
    await supabase.from("iso_cards").delete().match({
      email: user.email,
      card_id: cardId,
      variant,
      condition
    });
  } else {
    await supabase.from("iso_cards").upsert({
      email: user.email,
      card_id: cardId,
      variant,
      condition,
      quantity: newCount
    }, {
      onConflict: "email,card_id,variant,condition"
    });
  }
};

  // -----------------------------
  // SEARCH
  // -----------------------------
  useEffect(() => {
    if (!search) {
      setCards([]);
      return;
    }

    async function searchCards() {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .ilike("name", `%${search}%`)
        .limit(50);

      setCards(data || []);
    }

    const delay = setTimeout(searchCards, 300);
    return () => clearTimeout(delay);
  }, [search]);

  // -----------------------------
  // FIND MATCHES
  // -----------------------------
  const findMatches = async () => {
    const { data } = await supabase.from("user_cards").select("*");

    const matches = [];

Object.entries(isoCards).forEach(([key, quantity]) => {
  const [cardId, variant, condition] = key.split("_");

  data.forEach(userCard => {
    if (cardId !== userCard.card_id) return;

    const variantMatch =
      variant === "any" || variant === userCard.variant;

    const conditionMatch =
      condition === "any" || condition === userCard.condition;

    if (
      variantMatch &&
      conditionMatch &&
      userCard.owned > 0 &&
      userCard.email !== user.email
    ) {
      matches.push({
        card_id: cardId,
        owner: userCard.email,
        variant: userCard.variant,
        condition: userCard.condition,
        owned: userCard.owned
      });
    }
  });
});

    console.log("MATCHES:", matches);
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">

      {/* ISO LIST */}
      <div className="bg-gray-800 p-3 rounded">
        <button
          onClick={() => setShowISO(!showISO)}
          className="mb-2 bg-gray-700 px-2 py-1 rounded text-white"
        >
          {showISO ? "Hide ISO" : "Show ISO"}
        </button>

        <button
          onClick={findMatches}
          className="ml-2 bg-purple-600 px-3 py-1 rounded text-white"
        >
          Find Matches
        </button>

        {showISO && (
          <div className="space-y-2">
            {Object.entries(isoCards).map(([key, qty]) => {
              const [cardId, variant, conndition] = key.split("_");

              return (
                <div key={key} className="flex justify-between bg-gray-700 p-2 rounded text-white">
                  <span>{cardId}</span>
                  <span>{variant}</span>
                  <span>{condition}</span>
                  <span>x{qty}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search cards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
      />

      {/* RESULTS */}
<div className="space-y-4">
  {cards.map((card) => {
    const variants = ["any", ...getVariants(card, "master")];

    return (
      <div key={card.id} className="bg-gray-800 p-2 rounded space-y-2">

        {/* CARD HEADER */}
        <div className="flex items-center gap-2">
          <img src={card.image_small} className="w-8 h-8" alt={card.name}/>
          <span className="text-white text-sm">
            {card.name} #{card.number}
          </span>
        </div>

        {/* VARIANT x CONDITION GRID */}
        <div className="space-y-2">
          {variants.map((variant) => (
            <div key={variant} className="space-y-1">

              <div className="text-xs text-gray-400">
                {variant.toUpperCase()}
              </div>

              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((condition) => {
                  const key = `${card.id}_${variant}_${condition}`;
                  const count = isoCards[key] || 0;

                  return (
                    <div
                      key={condition}
                      className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"
                    >
                      <span className="text-xs text-white">
                        {condition.toUpperCase()}
                      </span>

                      <button
                        onClick={() => handleISORemove(card.id, variant, condition)}
                        className="bg-red-600 px-1 rounded text-white"
                      >
                        -
                      </button>

                      <span className="text-white text-xs w-4 text-center">
                        {count}
                      </span>

                      <button
                        onClick={() => handleISOAdd(card.id, variant, condition)}
                        className="bg-green-600 px-1 rounded text-white"
                      >
                        +
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

      </div>
    );
  })}
</div>
    </div>
  );


}
