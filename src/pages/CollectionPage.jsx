import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import CardGrid from "../components/CardGrid";

import CompletionSummary from "../components/CompletionSummary";
import InviteUser from "../components/InviteUser";
import FiltersSection from "../components/FiltersSection";
import CollectionHeader from "../components/CollectionHeader";

import { getVisibleCards } from "../utils/cardSelectors.js";

import PriceRefreshButton from "../components/PriceRefreshButton";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("number");

  const [selectedOwnerEmails, setSelectedOwnerEmails] = useState([]);

  const [exFilter, setExFilter] = useState("all");

  const myRole = collectionUsers.find(
    u => u.email === user?.email
  )?.role;

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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

      const { data, error } = await supabase
        .from("user_collections")
        .select("*")
        .eq("collection_id", collectionId);

      if (error) {
        console.error("Error loading collection users:", error);
        return;
      }

      setCollectionUsers(data || []);
    }

    loadCollectionUsers();
  }, [collectionId]);

  useEffect(() => {
  if (collectionUsers.length === 0) return;

  setSelectedOwnerEmails(collectionUsers.map(u => u.email));
}, [collectionUsers]);

  useEffect(() => {
    async function loadCollection() {
      if (!collectionId || !user) return;

      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();

      if (error) {
        console.error("Error loading collection:", error);
        return;
      }

      if (!data) return;

      const { data: access } = await supabase
        .from("user_collections")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("email", user.email)
        .maybeSingle();

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

      const cardIds = cards.map(card => card.id);

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("email", user.email)
        .in("card_id", cardIds);

      if (error) {
        console.error("Error loading current user cards:", error);
        return;
      }

      const map = {};

      (data || []).forEach(item => {
        const key = `${item.card_id}_${item.variant}`;
        map[key] = Number(item.owned || 0);
      });

      setUserCards(map);
    }

    loadUserCards();
  }, [user, cards]);

  useEffect(() => {
    async function loadAllUserCards() {
      if (!collectionUsers.length || cards.length === 0) return;

      const emails = collectionUsers.map(u => u.email);
      const cardIds = cards.map(card => card.id);

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .in("email", emails)
        .in("card_id", cardIds)
        .range(0, 10000);

      if (error) {
        console.error("Error loading all user cards:", error);
        return;
      }

      const map = {};

      (data || []).forEach(item => {
        const key = `${item.email}_${item.card_id}_${item.variant}`;
        map[key] = Number(item.owned || 0);
      });

      setAllUserCards(map);
    }

    loadAllUserCards();
  }, [collectionUsers, cards]);

  const visibleCards = collection
    ? getVisibleCards({
        cards,
        userCards,
        allUserCards,
        collectionUsers,
        selectedOwnerEmails,
        isCollab: collection?.is_collab,
        setFilter,
        statusFilter,
        collection,
        searchQuery,
        sortBy,
        typeFilter,
        supertypeFilter,
        exFilter,
        legalOnly
      })
    : [];

  const handleAdd = async (cardId, variant) => {
    if (!user) return;

    const key = `${cardId}_${variant}`;
    const allUsersKey = `${user.email}_${cardId}_${variant}`;

    const current = userCards[key] || 0;
    const newCount = current + 1;

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

    if (error) console.error("Error adding card:", error);
  };

  const handleRemove = async (cardId, variant) => {
    if (!user) return;

    const key = `${cardId}_${variant}`;
    const allUsersKey = `${user.email}_${cardId}_${variant}`;

    const current = userCards[key] || 0;
    if (current <= 0) return;

    const newCount = current - 1;

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

    if (error) console.error("Error removing card:", error);
  };

  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

  return (
    <div className="bg-black">
      <CollectionHeader
        collection={collection}
        collectionName={collectionName}
        cards={cards}
      />
      
      <CompletionSummary 
        cards={cards}
        userCards={userCards}
        allUserCards={allUserCards}
        collectionUsers={collectionUsers}
        selectedOwnerEmails={selectedOwnerEmails}
        currentUserEmail={user.email}
        isCollab={collection?.is_collab}
        setFilter={setFilter}
        collection={collection}
      />

      {collection?.type === "set_code" && (
        <PriceRefreshButton
          setCode={collection.rule}
          userEmail={user.email}
          myRole={myRole}
        />
      )}

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
        collectionUsers={collectionUsers}
        currentUserEmail={user.email}
        selectedOwnerEmails={selectedOwnerEmails}
        setSelectedOwnerEmails={setSelectedOwnerEmails}
        exFilter={exFilter}
        setExFilter={setExFilter}
      />

      {collection && myRole === "owner" && (
        <details className="m-2 bg-gray-800 rounded-lg border border-gray-700">
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
        selectedOwnerEmails={selectedOwnerEmails}
        setSelectedOwnerEmails={setSelectedOwnerEmails}
      />
    </div>
  );
}
