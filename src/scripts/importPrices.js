import fetch from "node-fetch";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { VARIANT_PRICE_MAP } from "../src/utils/priceUtils.js";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const API_KEY = process.env.POKEMON_TCG_API_KEY;

async function loadCards() {
  const { data, error } = await supabase
    .from("cards")
    .select("id,set_code");

  if (error) {
    console.error("Error loading cards:", error);
    process.exit(1);
  }

  return data || [];
}

function extractPriceData(apiCard, variant) {
  const tcgplayer = apiCard.tcgplayer;

  if (!tcgplayer?.prices) return null;

  const mapped = VARIANT_PRICE_MAP[variant];

  if (!mapped) return null;

  const prices = tcgplayer.prices[mapped];

  if (!prices) return null;

  return {
    market_price: prices.market ?? null,
    low_price: prices.low ?? null,
    mid_price: prices.mid ?? null,
    high_price: prices.high ?? null
  };
}

async function importPrices() {
  const cards = await loadCards();

  console.log(`Loaded ${cards.length} cards`);

  let inserted = 0;

  for (const card of cards) {
    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards/${card.id}`,
        {
          headers: {
            "X-Api-Key": API_KEY
          }
        }
      );

      const json = await response.json();

      const apiCard = json.data;

      if (!apiCard) {
        console.log(`No API card found for ${card.id}`);
        continue;
      }

      const variants = [
        "normal",
        "holo",
        "reverse",
        "pokeball",
        "masterball"
      ];

      for (const variant of variants) {
        const priceData = extractPriceData(apiCard, variant);

        if (!priceData) continue;

        const payload = {
          card_id: card.id,
          variant,
          currency: "USD",
          market_price: priceData.market_price,
          low_price: priceData.low_price,
          mid_price: priceData.mid_price,
          high_price: priceData.high_price,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("card_prices")
          .upsert(payload, {
            onConflict: "card_id,variant"
          });

        if (error) {
          console.error(
            `Price insert failed ${card.id} ${variant}`,
            error
          );
          continue;
        }

        inserted++;

        console.log(
          `✓ ${card.id} ${variant} -> $${priceData.market_price}`
        );
      }

      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.error(`Import failed for ${card.id}`, err);
    }
  }

  console.log(`DONE. Inserted/updated ${inserted} prices.`);
}

importPrices();
