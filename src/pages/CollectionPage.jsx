import { useState, useEffect } from "react";
import CardGrid from "../components/CardGrid";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
//import { getCardStats} from "../utils/cardUtils";
//import { getVariants} from "../utils/cardUtils";
// FILTERS
import Filters from "../components/Filters";
import StatusFilters from "../components/StatusFilters";
import TypeFilters from "../components/TypeFilters";
import SupertypeFilters from "../components/SupertypeFilters";
import FiltersSection from "../components/FiltersSection";

import { isSecretCard } from "../utils/setUtils";
import { getVisibleCards } from "../utils/cardSelectors.js";


export default function CollectionPage() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get("id");
  const collectionName = searchParams.get("name");

  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [userCards, setUserCards] = useState({});
  const [setFilter, setSetFilter] = useState("master");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState([]); // multi-select
  const [supertypeFilter, setSupertypeFilter] = useState([]);
  const [legalOnly, setLegalOnly] = useState(false);

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


  // KEEP THIS FILTER
  const visibleCards = collection 
    ? getVisibleCards({
        cards,
        userCards,
        setFilter,
        statusFilter,
        collection,
        typeFilter,
        supertypeFilter,
        legalOnly
      })
    : [];
// -------------------------
// FILTER CARDS
// ----------------------------
/*const filteredCards = cards.filter(card => {
  const stats = getCardStats(card, userCards, setFilter);
  const isSecret = isSecretCard(card, collection.rule);

  // set-level filtering
  if (setFilter === "standard") return !isSecret;
  if (setFilter === "parallel") return !isSecret;
  if (setFilter === "master") return true;

  return true;

  switch (statusFilter) {
    case "owned":
      return stats.isComplete;

    case "needed":
      return stats.isMissing;

    case "duplicates":
      return getVariants(card, setFilter).some(v => {
        const key = `${card.id}_${v}`;
        return (userCards[key]?.total || 0) > 1;
      });

    default:
      return true;
  }
});*/

  
/*const filteredCards = getVisibleCards({
  cards,
  userCards,
  collection,
  setFilter,
  statusFilter,
});*/

  
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
      map[key] = Number(item.owned || 0);
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
  const current = userCards[key] || 0;
  const newCount = current + 1;

  // Optimistic update
  setUserCards(prev => ({
    ...prev,
    [key]: newCount
  }));

  const { error } = await supabase
    .from("user_cards")
    .upsert({
      email: user.email,
      card_id: cardId,
      variant,
      owned: newCount
    }, {
      onConflict: "email,card_id,variant"
    });

  if (error) console.error(error);
};

// -----------------------------
// REMOVE CARD
// -----------------------------
const handleRemove = async (cardId, variant) => {
  if (!user) return;

  const key = `${cardId}_${variant}`;
  const current = userCards[key] || 0;

  if (current <= 0) return;

  const newCount = current - 1;

  setUserCards(prev => ({
    ...prev,
    [key]: newCount
  }));

  const { error } = await supabase
    .from("user_cards")
    .upsert({
      email: user.email,
      card_id: cardId,
      variant,
      owned: newCount
    }, {
      onConflict: "email,card_id,variant"
    });

  if (error) console.error(error);
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

      <FiltersSection
        collection={collection}
        setFilter={setFilter}
        setSetFilter={setSetFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        supertypeFilter={supertypeFilter}
        setSupertypeFilter={setSupertypeFilter}
        legalOnly={legalOnly}
        setLegalOnly={setLegalOnly}
      />
      <div className="p-4">
        <button
          onClick={() => setLegalOnly(prev => !prev)}
          className={`px-3 py-1 rounded ${
            legalOnly ? "bg-yellow-500" : "bg-gray-700"
          }`}
        >
          Legal Only
        </button>
      </div>

      <CardGrid
        cards={visibleCards}
        userCards={userCards}
        setFilter={setFilter}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />
    </div>
  );
}

