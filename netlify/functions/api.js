import { createClient } from "@supabase/supabase-js";

const VARIANT_PRICE_MAP = {
  normal: "normal",
  holo: "holofoil",
  reverse: "reverseHolofoil",
  pokeball: "reverseHolofoil",
  masterball: "reverseHolofoil"
};

const POKEMON_TCG_API_KEY = process.env.POKEMON_TCG_API_KEY;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  console.log("FUNCTION HIT");
  console.log("Query:", event.queryStringParameters);

  const { action } = event.queryStringParameters || {};

  try {
    if (action === "getCardsForCollection") {
      const { collectionId } = event.queryStringParameters;

      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("collection_id", collectionId);

      if (error) throw error;

      return response(data);
    }

    if (action === "health") {
      return response({
        success: true,
        message: "Function is working",
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasPokemonKey: !!process.env.POKEMON_TCG_API_KEY
      });
    }

    if (action === "getUserCards") {
      const { collectionId } = event.queryStringParameters;

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .eq("collection_id", collectionId);

      if (error) throw error;

      return response(data);
    }

    if (action === "saveUserCard") {
      const {
        email,
        collectionId,
        cardId,
        variant,
        owned
      } = event.queryStringParameters;

      const { data: existing } = await supabase
        .from("user_cards")
        .select("*")
        .eq("email", email)
        .eq("collection_id", collectionId)
        .eq("card_id", cardId)
        .eq("variant", variant)
        .maybeSingle();

      let newOwned = 0;

      if (!existing) {
        newOwned = owned === "increment" ? 1 : Number(owned || 0);
      } else {
        const current = existing.owned || 0;

        if (owned === "increment") {
          newOwned = current + 1;
        } else if (owned === "decrement") {
          newOwned = Math.max(0, current - 1);
        } else {
          newOwned = Number(owned || 0);
        }
      }

      const { error } = await supabase
        .from("user_cards")
        .upsert(
          {
            email,
            collection_id: collectionId,
            card_id: cardId,
            variant,
            owned: newOwned
          },
          {
            onConflict: "email,collection_id,card_id,variant"
          }
        );

      if (error) throw error;

      return response({ success: true, owned: newOwned });
    }

    if (action === "getPriceImportStatus") {
      const { setCode } = event.queryStringParameters;

      if (!setCode) {
        return response({ error: "Missing setCode" }, 400);
      }

      const today = new Date().toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("price_import_logs")
        .select("*")
        .eq("set_code", setCode)
        .eq("import_date", today)
        .maybeSingle();

      if (error) throw error;

      return response({
        setCode,
        importedToday: !!data,
        log: data || null
      });
    }

    if (action === "importPrices") {
      const { setCode, email } = event.queryStringParameters;

      if (!setCode) {
        return response({ error: "Missing setCode" }, 400);
      }

      if (!email) {
        return response({ error: "Missing email" }, 400);
      }

      if (!POKEMON_TCG_API_KEY) {
        return response({ error: "Missing POKEMON_TCG_API_KEY" }, 500);
      }

      const today = new Date().toISOString().slice(0, 10);

      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("*")
        .eq("rule", setCode)
        .eq("type", "set_code")
        .maybeSingle();

      if (collectionError) throw collectionError;

      if (!collection) {
        return response({ error: "Collection not found" }, 404);
      }

      const { data: access, error: accessError } = await supabase
        .from("user_collections")
        .select("*")
        .eq("collection_id", collection.id)
        .eq("email", email)
        .maybeSingle();

      if (accessError) throw accessError;

      if (!access || !["owner", "editor"].includes(access.role)) {
        return response({ error: "Unauthorized" }, 401);
      }

      const { data: existingLog, error: logCheckError } = await supabase
        .from("price_import_logs")
        .select("*")
        .eq("set_code", setCode)
        .eq("import_date", today)
        .maybeSingle();

      if (logCheckError) throw logCheckError;

      if (existingLog) {
        return response({
          success: false,
          alreadyImported: true,
          message: "Prices already refreshed today",
          log: existingLog
        });
      }

      const { data: cards, error: cardsError } = await supabase
        .from("cards")
        .select("id,set_code")
        .eq("set_code", setCode)
        .range(0, 10000);

      if (cardsError) throw cardsError;

      let updated = 0;
      let skipped = 0;

      for (const card of cards || []) {
        try {
          const pokemonResponse = await fetch(
            `https://api.pokemontcg.io/v2/cards/${card.id}`,
            {
              headers: {
                "X-Api-Key": POKEMON_TCG_API_KEY
              }
            }
          );

          if (!pokemonResponse.ok) {
            console.error("Pokemon API error:", card.id, pokemonResponse.status);
            skipped++;
            continue;
          }

          const json = await pokemonResponse.json();
          const apiCard = json.data;

          if (!apiCard?.tcgplayer?.prices) {
            skipped++;
            continue;
          }

          for (const [variant, apiPriceKey] of Object.entries(VARIANT_PRICE_MAP)) {
            const prices = apiCard.tcgplayer.prices[apiPriceKey];

            if (!prices) continue;

            const { error } = await supabase
              .from("card_prices")
              .upsert(
                {
                  card_id: card.id,
                  variant,
                  currency: "USD",
                  market_price: prices.market ?? null,
                  low_price: prices.low ?? null,
                  mid_price: prices.mid ?? null,
                  high_price: prices.high ?? null,
                  updated_at: new Date().toISOString()
                },
                {
                  onConflict: "card_id,variant"
                }
              );

            if (error) {
              console.error("Price upsert error:", card.id, variant, error);
              skipped++;
              continue;
            }

            updated++;
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (cardError) {
          console.error("Card price import failed:", card.id, cardError);
          skipped++;
        }
      }

      const { error: insertLogError } = await supabase
        .from("price_import_logs")
        .insert({
          set_code: setCode,
          import_date: today,
          imported_by: email
        });

      if (insertLogError) throw insertLogError;

      return response({
        success: true,
        setCode,
        cardsChecked: cards?.length || 0,
        pricesUpdated: updated,
        skipped
      });
    }

    return response({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("FUNCTION ERROR:", err);

    return response(
      {
        error: err.message || "Unknown function error"
      },
      500
    );
  }
}

function response(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}
