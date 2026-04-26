import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getVariants } from "../utils/cardUtils";
import VariantRow from "../components/VariantRow";

export default function ISOPage() {
  const [user, setUser] = useState(null);
  const [isoCards, setIsoCards] = useState({});
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [showISO, setShowISO] = useState(true);

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
              const [cardId, variant] = key.split("_");

              return (
                <div key={key} className="flex justify-between bg-gray-700 p-2 rounded text-white">
                  <span>{cardId}</span>
                  <span>{variant}</span>
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
          const variants = getVariants(card, "master"); // ✅ FIXED LOCATION

          return (
            <div key={card.id} className="bg-gray-800 p-2 rounded">

              <div className="flex justify-between items-center">
                <img src={card.image_small} className="w-8 h-8" alt={card.name}/>
                <span className="text-white">
                  {card.name} #{card.number} [{card.set_name}]
                </span>
              </div>

              {/* VARIANTS */}
              <div className="mt-2 space-y-1">
                {variants.map((v) => {
                  const key = `${card.id}_${v}`;
                  const count = isoCards[key] || 0;

                  return (
                    <VariantRow
                      key={v}
                      variant={v}
                      count={count}
                      onAdd={() => handleISOAdd(card.id, v)}
                      onRemove={() => handleISORemove(card.id, v)}
                    />
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
