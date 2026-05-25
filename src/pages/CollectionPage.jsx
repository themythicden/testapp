import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import CardGrid from "../components/CardGrid";
import InviteUser from "../components/InviteUser";
import FiltersSection from "../components/FiltersSection";

import { getVisibleCards } from "../utils/cardSelectors.js";

export default function CollectionPage() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get("id");
  const collectionName = searchParams.get("name");

  const [user, setUser] = useState(null);
  const [collection, setCollection] = useState(null);
  const [collectionUsers, setCollectionUsers] = useState([]);

  const [cards, setCards] = useState([]);
  const [userCards, setUserCards] = useState({});
  const [allUserCards, setAllUserCards] = useState({});

  const [setFilter, setSetFilter] = useState("master");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState([]);
  const [supertypeFilter, setSupertypeFilter] = useState([]);
  const [legalOnly, setLegalOnly] = useState(false);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("number");

  const myRole = collectionUsers.find(
    u => u.email === user?.email
  )?.role;

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      console.log("======== AUTH USER ========");
      console.log(data.user);

      setUser(data.user || null);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("======== AUTH STATE CHANGE ========");
        console.log("EVENT:", _event);
        console.log("SESSION USER:", session?.user);

        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadCollectionUsers() {
      if (!collectionId) return;

      console.log("======== LOAD COLLECTION USERS ========");
      console.log("COLLECTION ID:", collectionId);

      const { data, error } = await supabase
        .from("user_collections")
        .select("*")
        .eq("collection_id", collectionId);

      console.log("COLLECTION USERS DATA:", data);
      console.log("COLLECTION USERS ERROR:", error);

      if (error) {
        console.error("Error loading collection users:", error);
        return;
      }

      setCollectionUsers(data || []);
    }

    loadCollectionUsers();
  }, [collectionId]);

  useEffect(() => {
    async function loadCollection() {
      if (!collectionId || !user) return;

      console.log("======== LOAD COLLECTION ========");
      console.log("COLLECTION ID:", collectionId);
      console.log("LOGGED IN EMAIL:", user.email);

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();

      console.log("COLLECTION DATA:", data);
      console.log("COLLECTION ERROR:", error);
      console.log("COLLECTION IS_COLLAB:", data?.is_collab);

      if (error) {
        console.error("Error loading collection:", error);
        return;
      }

      if (!data) return;

      const { data: access, error: accessError } = await supabase
        .from("user_collections")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("email", user.email)
        .maybeSingle();

      console.log("ACCESS ROW:", access);
      console.log("ACCESS ERROR:", accessError);

      if (!access && data.owner_email !== user.email) {
        console.error("No access to this collection");
        return;
      }

      setCollection(data);
    }

    loadCollection();
  }, [collectionId, user]);

  useEffect(() => {
    async function loadCards() {
      if (!collection) return;

      console.log("======== LOAD CARDS ========");
      console.log("COLLECTION:", collection);

      let query = supabase.from("cards").select("*");

      if (collection.type === "set_code") {
        query = query.eq("set_code", collection.rule);
      }

      if (collection.type === "pokemon") {
        query = query.ilike("name", `%${collection.rule}%`);
      }

      const { data, error } = await query.order("number", {
        ascending: true
      });

      console.log("CARDS DATA COUNT:", data?.length);
      console.log("FIRST 5 CARDS:", data?.slice(0, 5));
      console.log("CARDS ERROR:", error);

      if (error) {
        console.error("Error loading cards:", error);
        return;
      }

      setCards(data || []);
    }

    loadCards();
  }, [collection]);

  useEffect(() => {
    async function loadUserCards() {
      if (!user || cards.length === 0) return;

      console.log("======== LOAD CURRENT USER CARDS ========");
      console.log("LOGGED IN EMAIL:", user.email);

      const cardIds = cards.map(card => card.id);

      console.log("CARD IDS COUNT:", cardIds.length);
      console.log("FIRST 10 CARD IDS:", cardIds.slice(0, 10));

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("email", user.email)
        .in("card_id", cardIds);

      console.log("CURRENT USER_CARDS DATA:", data);
      console.log("CURRENT USER_CARDS ERROR:", error);

      if (error) {
        console.error("Error loading current user cards:", error);
        return;
      }

      const map = {};

      (data || []).forEach(item => {
        const key = `${item.card_id}_${item.variant}`;

        console.log("CURRENT USER CARD KEY:", key, "OWNED:", item.owned);

        map[key] = Number(item.owned || 0);
      });

      console.log("CURRENT USER_CARDS MAP:", map);

      setUserCards(map);
    }

    loadUserCards();
  }, [user, cards]);

  useEffect(() => {
    async function loadAllUserCards() {
      if (!collectionUsers.length || cards.length === 0) {
        console.log("======== SKIPPING LOAD ALL USER CARDS ========");
        console.log("collectionUsers.length:", collectionUsers.length);
        console.log("cards.length:", cards.length);
        return;
      }

      console.log("======== LOAD ALL USER CARDS ========");
      console.log("LOGGED IN USER:", user?.email);
      console.log("COLLECTION IS_COLLAB:", collection?.is_collab);
      console.log("COLLECTION USERS:", collectionUsers);

      const emails = collectionUsers.map(u => u.email);
      const cardIds = cards.map(card => card.id);

      console.log("EMAILS USED FOR ALL USER CARDS:", emails);
      console.log("CARD IDS COUNT:", cardIds.length);
      console.log("FIRST 10 CARD IDS:", cardIds.slice(0, 10));

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .in("email", emails)
        .in("card_id", cardIds)
        .range(0, 10000);

      console.log("ALL USER_CARDS RAW DATA:", data);
      console.log("ALL USER_CARDS ERROR:", error);

      if (error) {
        console.error("Error loading all user cards:", error);
        return;
      }

      const map = {};

      (data || []).forEach(item => {
        const key = `${item.email}_${item.card_id}_${item.variant}`;

        console.log("ALL USER CARD GENERATED KEY:", key, "OWNED:", item.owned);

        map[key] = Number(item.owned || 0);
      });

      console.log("ALL USER_CARDS MAP:", map);
      console.log("ALL USER_CARDS MAP KEYS:", Object.keys(map));

      setAllUserCards(map);
    }

    loadAllUserCards();
  }, [collectionUsers, cards, user, collection]);

  const visibleCards = collection
    ? getVisibleCards({
        cards,
        userCards,
        allUserCards,
        collectionUsers,
        isCollab: collection?.is_collab,
        setFilter,
        statusFilter,
        collection,
        searchQuery,
        sortBy,
        typeFilter,
        supertypeFilter,
        legalOnly
      })
    : [];

  const handleAdd = async (cardId, variant) => {
    if (!user) return;

    console.log("======== HANDLE ADD ========");
    console.log("USER:", user.email);
    console.log("CARD ID:", cardId);
    console.log("VARIANT:", variant);

    const key = `${cardId}_${variant}`;
    const allUsersKey = `${user.email}_${cardId}_${variant}`;

    const current = userCards[key] || 0;
    const newCount = current + 1;

    console.log("CURRENT KEY:", key);
    console.log("ALL USERS KEY:", allUsersKey);
    console.log("CURRENT COUNT:", current);
    console.log("NEW COUNT:", newCount);

    setUserCards(prev => ({
      ...prev,
      [key]: newCount
    }));

    setAllUserCards(prev => ({
      ...prev,
      [allUsersKey]: newCount
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

    console.log("ADD ERROR:", error);

    if (error) {
      console.error("Error adding card:", error);
    }
  };

  const handleRemove = async (cardId, variant) => {
    if (!user) return;

    console.log("======== HANDLE REMOVE ========");
    console.log("USER:", user.email);
    console.log("CARD ID:", cardId);
    console.log("VARIANT:", variant);

    const key = `${cardId}_${variant}`;
    const allUsersKey = `${user.email}_${cardId}_${variant}`;

    const current = userCards[key] || 0;

    if (current <= 0) return;

    const newCount = current - 1;

    console.log("CURRENT KEY:", key);
    console.log("ALL USERS KEY:", allUsersKey);
    console.log("CURRENT COUNT:", current);
    console.log("NEW COUNT:", newCount);

    setUserCards(prev => ({
      ...prev,
      [key]: newCount
    }));

    setAllUserCards(prev => ({
      ...prev,
      [allUsersKey]: newCount
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

    console.log("REMOVE ERROR:", error);

    if (error) {
      console.error("Error removing card:", error);
    }
  };

  console.log("======== RENDER STATE ========");
  console.log("USER:", user?.email);
  console.log("COLLECTION:", collection);
  console.log("COLLECTION IS_COLLAB:", collection?.is_collab);
  console.log("COLLECTION USERS:", collectionUsers);
  console.log("MY ROLE:", myRole);
  console.log("CARDS COUNT:", cards.length);
  console.log("USER_CARDS:", userCards);
  console.log("ALL_USER_CARDS:", allUserCards);
  console.log("VISIBLE CARDS COUNT:", visibleCards.length);

  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showMineOnly={showMineOnly}
        setShowMineOnly={setShowMineOnly}
      />

      {collection && myRole === "owner" && (
  <details className="mx-4 mb-4 bg-gray-800 rounded-lg border border-gray-700">
    <summary className="cursor-pointer p-3 text-white font-bold">
      Invite user to collection
    </summary>

    <div className="p-3 border-t border-gray-700">
      <InviteUser collectionId={collection.id} myRole={myRole} />
    </div>
  </details>
)}

      <CardGrid
        cards={visibleCards}
        userCards={userCards}
        allUserCards={allUserCards}
        collectionUsers={collectionUsers}
        setFilter={setFilter}
        statusFilter={statusFilter}
        onAdd={handleAdd}
        onRemove={handleRemove}
        currentUserEmail={user.email}
        isCollab={collection?.is_collab}
        myRole={myRole}
      />
    </div>
  );
}
