import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ISOPage() {
  const [user, setUser] = useState(null);
  const [isoCards, setIsoCards] = useState([]);
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
    if (!user) return;

    async function loadISO() {
      const { data } = await supabase
        .from("iso_cards")
        .select("*")
        .eq("email", user.email);

      setIsoCards(data || []);
    }

    loadISO();
  }, [user]);

  // -----------------------------
  // SEARCH ALL CARDS
  // -----------------------------
  useEffect(() => {
    if (!search) return;

    async function searchCards() {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .or(`name.ilike.%${search}%,number.ilike.%${search}%`)
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
  // UI
  // -----------------------------
  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">

      {/* ISO LIST */}
      <div className="bg-gray-800 p-3 rounded">
        <button
          onClick={() => setShowISO(!showISO)}
          className="mb-2 bg-gray-700 px-2 py-1 rounded"
        >
          {showISO ? "Hide ISO" : "Show ISO"}
        </button>

        {showISO && (
          <div className="space-y-2">
            {isoCards.map((item, i) => (
              <div key={i} className="flex justify-between bg-gray-700 p-2 rounded">
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
        className="w-full p-2 rounded bg-gray-800 border border-gray-600"
      />

      {/* RESULTS */}
      <div className="space-y-2">
        {cards.map(card => (
          <div key={card.id} className="flex justify-between bg-gray-700 p-2 rounded">
            <span>{card.name} #{card.number}</span>

            <div className="flex gap-2">
              <button
                onClick={() => addISO(card, "any")}
                className="bg-blue-600 px-2 py-1 rounded"
              >
                ANY
              </button>

              <button
                onClick={() => addISO(card, "normal")}
                className="bg-green-600 px-2 py-1 rounded"
              >
                NORMAL
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
