import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function CollectionsPage({ user }) {
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();

  // 🚫 protect page
  if (!user) return <div>Please log in</div>;

  // 📦 LOAD COLLECTIONS
  useEffect(() => {
  console.log("LOADING COLLECTIONS...");
  console.log("AUTH USER:", user);
  if (!user?.email) return;

  async function loadCollections() {
    // STEP 1
    const { data: userCollections, error } = await supabase
      .from("user_collections")
      .select("collection_id")
      .eq("email", user.email);

      
  console.log("USER OBJECT:", user);
  console.log("EMAIL:", user?.email);

    if (error) {
      console.error(error);
      return;
    }

    const ids = userCollections.map(row => row.collection_id);

    if (!ids.length) {
      setCollections([]);
      return;
    }

    // STEP 2
    const { data: collectionsData, error: collectionsError } = await supabase
      .from("collections")
      .select("*")
      .in("id", ids);

    if (collectionsError) {
      console.error(collectionsError);
      return;
    }


    setCollections(collectionsData || []);
  }

  loadCollections();
}, [user?.email]);

  // ➕ CREATE COLLECTION
  const createCollection = async () => {
    if (!newName) return;

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name: newName,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setCollections(prev => [...prev, data]);
    setNewName("");
  };

  console.log("COLLECTIONS STATE:", collections);

return (
  <div>
    <h2>Collections Debug</h2>

    {collections.length === 0 ? (
      <p>No collections found</p>
    ) : (
      collections.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/collection?id=${c.id}&name=${c.name}`)}
            className="cursor-pointer p-4 border hover:bg-gray-100"
          >
            {c.name}
          </div>
      ))
    )}
  </div>
);
}