import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🔥 IMPORTANT (server-side only)
);

export async function handler(event) {
  
console.log("FUNCTION HIT");
console.log("Query:", event.queryStringParameters);

  const { action } = event.queryStringParameters;

  try {
    // ============================
    // GET CARDS FOR COLLECTION
    // ============================
    if (action === "getCardsForCollection") {
      const { collectionId } = event.queryStringParameters;

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("collection_id", collectionId);

      if (error) throw error;

      return response(data);
    }

    // ============================
    // GET USER CARDS
    // ============================
    if (action === "getUserCards") {
      const { collectionId } = event.queryStringParameters;

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("collection_id", collectionId);

      if (error) throw error;

      return response(data);
    }

    // ============================
    // SAVE USER CARD
    // ============================
    if (action === "saveUserCard") {
      const {
        email,
        collectionId,
        cardId,
        variant,
        owned
      } = event.queryStringParameters;

      // 🔍 Get existing row
      const { data: existing } = await supabase
        .from("user_cards")
        .select("*")
        .eq("email", email)
        .eq("collection_id", collectionId)
        .eq("card_id", cardId)
        .eq("variant", variant)
        .single();

      let newOwned = 0;

      if (!existing) {
        // first time
        newOwned = owned === "increment" ? 1 : 0;
      } else {
        const current = existing.owned || 0;

        if (owned === "increment") newOwned = current + 1;
        else if (owned === "decrement") newOwned = Math.max(0, current - 1);
        else newOwned = Number(owned); // fallback
      }

      const { error } = await supabase
        .from("user_cards")
        .upsert({
          email,
          collection_id: collectionId,
          card_id: cardId,
          variant,
          owned: newOwned
        });

      if (error) throw error;

      return response({ success: true, owned: newOwned });
    }

    // ============================
    return response({ error: "Invalid action" }, 400);

  } catch (err) {
    return response({ error: err.message }, 500);
  }
}

// ============================
// HELPER
// ============================
function response(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}
