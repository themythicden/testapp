import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getVariants } from "../utils/cardUtils";
import VariantRow from "../components/VariantRow"

export default function ISOPage() {
  const [user, setUser] = useState(null);
  const [isoCards, setIsoCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState("");
  const [showISO, setShowISO] = useState(true);
  const [variantFilter, setVariantFilter] = useState(["any"]);
  

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
  
      setIsoCards(map);
    }
  
    loadISO();
  }, [user]);

  // -----------------------------
  // ISO ADD
  // ----------------------------- 
  const handleISOAdd = async (cardId, variant) => {
  const key = `${cardId}_${variant}`;
  const current = isoCards[key] || 0;
  const newCount = current + 1;

  // Optimistic UI
  setIsoCards(prev => ({
    ...prev,
    [key]: newCount
  }));

  const { error } = await supabase
    .from("iso_cards")
    .upsert({
      email: user.email,
      card_id: cardId,
      variant,
      quantity: newCount
    }, {
      onConflict: "email,card_id,variant"
    });

  if (error) console.error(error);
};

   // -----------------------------
  // ISO REMOVE
  // -----------------------------
  const handleISORemove = async (cardId, variant) => {
  const key = `${cardId}_${variant}`;
  const current = isoCards[key] || 0;

  if (current <= 0) return;

  const newCount = current - 1;

  // Optimistic UI
  setIsoCards(prev => {
    const updated = { ...prev };

    if (newCount === 0) {
      delete updated[key];
    } else {
      updated[key] = newCount;
    }

    return updated;
  });

  if (newCount === 0) {
    await supabase
      .from("iso_cards")
      .delete()
      .match({
        email: user.email,
        card_id: cardId,
        variant
      });
  } else {
    await supabase
      .from("iso_cards")
      .upsert({
        email: user.email,
        card_id: cardId,
        variant,
        quantity: newCount
      }, {
        onConflict: "email,card_id,variant"
      });
  }
};
  
  
  // -----------------------------
  // SEARCH ALL CARDS
  // -----------------------------
  useEffect(() => {
    if (!search) return;

    async function searchCards() {
      const { data } = await supabase
        .from("cards")
        .select("*")
        //.or(`name.ilike.%${search}%,number.ilike.%${search}%`)
        .or(`name.ilike.%${search}%`)
        //.ilike("number", `%$(search)%`)
        .limit(50);

      setCards(data || []);
    }

    const delay = setTimeout(searchCards, 300);
    return () => clearTimeout(delay);
  }, [search]);

  // -----------------------------
  // ADD ISO
  // -----------------------------
  const addISO = async (card, variant = "any") => {
    const qty = prompt("Quantity?", 1);
    if (!qty) return;

    const { error } = await supabase.from("iso_cards").upsert({
      email: user.email,
      card_id: card.id,
      variant,
      quantity: Number(qty)
    }, {
      onConflict: "email,card_id,variant"
    });

    if (!error) {
      setIsoCards(prev => [
        ...prev,
        { card_id: card.id, variant, quantity: Number(qty) }
      ]);
    }
  };

  // -----------------------------
  // FIND MATCHES
  // -----------------------------
  const findMatches = async () => {
  const { data } = await supabase.from("user_cards").select("*");

  const matches = [];

  isoCards.forEach(iso => {
    data.forEach(userCard => {
      if (iso.card_id !== userCard.card_id) return;

      if (
        iso.variant === "any" ||
        iso.variant === userCard.variant
      ) {
        if (userCard.owned > 0 && userCard.email !== user.email) {
          matches.push({
            card_id: iso.card_id,
            owner: userCard.email,
            variant: userCard.variant,
            owned: userCard.owned
          });
        }
      }
    });
  });

  console.log("MATCHES:", matches);
};


  // FUNCTIONS
  const handleAdd = async (card) => {
  const variants = selectedVariants[card.id] || ["any"];

  for (const variant of variants) {
    await supabase.from("iso_cards").insert({
      email: user.email,
      card_id: card.id,
      variant,
      quantity: 1
    });
  }
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
          {isoCards.map((item, i) => (
            <div key={i} className="flex justify-between bg-gray-700 p-2 rounded text-white">
              <span>{item.card_id}</span>
              <span>{item.variant}</span>
              <span>x{item.quantity}</span>
            </div>
          ))}
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
    <div className="space-y-2">
      {cards.map((card) => (
        // --- FIX: Added Fragment to wrap siblings ---
        <React.Fragment key={card.id}>
          <div className="flex justify-between bg-gray-700 p-2 rounded">
            <img src={card.image_small} className="w-8 h-8" alt={card.name}/>
            <span className="text-white">{card.name} #{card.number} [{card.set_name}]</span>
            <button onClick={() => handleAdd(card)} className="text-white bg-blue-600 px-2 rounded">
              Add
            </button>
          </div>

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
        </React.Fragment>
      ))}
    </div>
  </div>
);

}
