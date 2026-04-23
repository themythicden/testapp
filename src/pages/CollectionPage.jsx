import { useState, useEffect } from "react";
import CardGrid from "../components/CardGrid";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function CollectionPage() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get("id");
  const collectionName = searchParams.get("name");

  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [userCards, setUserCards] = useState({});
  const [setFilter, setSetFilter] = useState("master");

  const activeUser = user; // clean alias

  // -----------------------------
  // AUTH
  // -----------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    }

    loadUser();

    // optional: live auth updates
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);



  const [collection, setCollection] = useState(null);

useEffect(() => {
  async function loadCollection() {
    if (!collectionId) return;

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (error) {
      console.error("Error loading collection:", error);
      return;
    }

    console.log("COLLECTION:", data);
    setCollection(data);
  }

  loadCollection();
}, [collectionId]);

// -----------------------------
// LOAD CARDS (REAL DB)
// -----------------------------
useEffect(() => {
  async function loadCards() {
    if (!collection) return;

    console.log("Applying rule:", collection.type, collection.rule);

    let query = supabase.from("cards").select("*");

    if (collection.type === "set_code") {
      query = query.eq("set_code", collection.rule);
    }

    if (collection.type === "pokemon") {
      query = query.ilike("name", `%${collection.rule}%`);
    }

    const { data, error } = await query.order("number",{ascending : true});

    if (error) {
      console.error("Error loading cards:", error);
      return;
    }

    console.log("CARDS:", data);
    setCards(data);
  }

  loadCards();
}, [collection]);

// -----------------------------
// LOAD USER OWNERSHIP
// -----------------------------
useEffect(() => {
  async function loadUserCards() {
    if (!user) return;

    console.log("Loading user cards for:", user.email);

    const { data, error } = await supabase
      .from("user_cards")
      .select("*")
      .eq("email", user.email);

    if (error) {
      console.error("Error loading user_cards:", error);
      return;
    }

    console.log("USER CARDS RAW:", data);

    const map = {};

    data.forEach(item => {
      const key = `${item.card_id}_${item.variant}`;

      map[key] = {
        total: Number(item.owned || 0),
        users: {
          [item.email]: Number(item.owned || 0)
        }
      };
    });

    setUserCards(map);
  }

  loadUserCards();
}, [user]);

// -----------------------------
// ADD CARD
// -----------------------------
const handleAdd = async (cardId, variant) => {
  if (!user) return;

  const key = `${cardId}_${variant}`;
  const current = userCards[key]?.users[user.email] || 0;
  const newCount = current + 1;

  // 🔁 Optimistic UI
  setUserCards(prev => ({
    ...prev,
    [key]: {
      total: newCount,
      users: {
        ...prev[key]?.users,
        [user.email]: newCount
      }
    }
  }));

  const { error } = await supabase
    .from("user_cards")
    .upsert(
      {
        email: user.email,
        card_id: cardId,
        variant,
        owned: newCount
      },
      {
        onConflict: "email,card_id,variant"
      }
    );

  if (error) console.error("Upsert error:", error);
};

// -----------------------------
// REMOVE CARD
// -----------------------------
const handleRemove = async (cardId, variant) => {
  if (!user) return;

  const key = `${cardId}_${variant}`;
  const current = userCards[key]?.users[user.email] || 0;

  if (current <= 0) return;

  const newCount = current - 1;

  // 🔁 Optimistic UI
  setUserCards(prev => ({
    ...prev,
    [key]: {
      total: newCount,
      users: {
        ...prev[key]?.users,
        [user.email]: newCount
      }
    }
  }));

  const { error } = await supabase
    .from("user_cards")
    .upsert(
      {
        email: user.email,
        card_id: cardId,
        variant,
        owned: newCount
      },
      {
        onConflict: "email,card_id,variant"
      }
    );

  if (error) console.error("Upsert error:", error);
};

  // -----------------------------
  // LOADING GUARD
  // -----------------------------
  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div>
      <h2 className="text-2xl p-4">
        {collectionName || "Collection"}
      </h2>

      <CardGrid
        cards={cards}
        userCards={userCards}
        setFilter={setFilter}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}

