import { SET_CONFIG } from "./setConfig";

export function getVariants(card, setView = "master") {
  const setCode = String(card.set_code || "")
    .trim()
    .toLowerCase();

  const config = SET_CONFIG[setCode];

  if (!config) {
    console.warn("No set configuration found:", {
      cardId: card.id,
      cardName: card.name,
      setCode: card.set_code
    });

    return ["normal"];
  }

  const base = Number(config.standard || 0);
  const number = getNumericCardNumber(card.number);

  const rarity = String(card.rarity || "")
    .trim()
    .toLowerCase();

  const supertype = String(card.supertype || "")
    .trim()
    .toLowerCase();

  const subtypes = normalizeSubtypes(card.subtypes);

  let group = "base_default";

  /*
   * RULE 1:
   * Anything above the standard/base set number is an extra card.
   *
   * Extra cards only receive the holo variant.
   */
  if (number > base) {
    group = "extra";
  } else {
    /*
     * RULE 2:
     * Classify cards that are inside the standard/base set.
     */
    if (supertype === "trainer") {
      if (subtypes.includes("item")) {
        group = "base_item";
      } else if (subtypes.includes("stadium")) {
        group = "base_stadium";
      } else {
        group = "base_trainer";
      }
    } else if (supertype === "energy") {
      if (rarity === "rare" || rarity === "rare holo") {
        group = "base_energy_rare";
      } else {
        group = "base_energy";
      }
    } else if (rarity === "common") {
      group = "base_common";
    } else if (rarity === "uncommon") {
      group = "base_uncommon";
    } else if (rarity === "rare" || rarity === "rare holo") {
      group = "base_rare";
    } else {
      /*
       * Other rarities inside the standard set receive holo only.
       */
      group = "base_default";
    }
  }

  const variants =
    config.variants[group] ||
    getDefaultVariantsForGroup(group);

  const view = config.views?.[setView];

  console.log("VARIANT CLASSIFICATION", {
    cardId: card.id,
    cardName: card.name,
    setCode,
    originalNumber: card.number,
    numericNumber: number,
    base,
    rarity,
    supertype,
    subtypes,
    group,
    variants,
    setView,
    view
  });

  if (!view || view === "all") {
    return variants;
  }

  return variants.filter(variant => view.includes(variant));
}


/**
 * Provides safe defaults when a set does not explicitly define a group.
 */
function getDefaultVariantsForGroup(group) {
  const defaults = {
    extra: ["holo"],

    base_common: ["normal", "reverse"],
    base_uncommon: ["normal", "reverse"],
    base_rare: ["holo", "reverse"],

    base_trainer: ["normal", "reverse"],
    base_item: ["normal", "reverse"],
    base_stadium: ["normal", "reverse"],

    base_energy: ["normal", "reverse"],
    base_energy_rare: ["holo", "reverse"],

    base_default: ["holo"]
  };

  return defaults[group] || ["holo"];
}


/**
 * Converts values such as:
 *
 * 101
 * 101a
 * TG01
 * GG35
 *
 * into a sortable numeric value.
 */
function getNumericCardNumber(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/\d+/);

  return match ? Number(match[0]) : 0;
}


/**
 * Normalises subtypes from arrays, JSON strings, or comma-separated text.
 */
function normalizeSubtypes(value) {
  if (Array.isArray(value)) {
    return value
      .map(subtype =>
        String(subtype || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  }

  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  /*
   * Supports database values such as:
   * ["Item", "Pokémon Tool"]
   */
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed)) {
        return parsed
          .map(subtype =>
            String(subtype || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean);
      }
    } catch {
      // Continue to comma-separated parsing.
    }
  }

  return text
    .split(",")
    .map(subtype =>
      subtype
        .replace(/[\[\]"]/g, "")
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
}


export function getCardStats(
  card,
  userCards = {},
  setFilter,
  options = {}
) {
  const variants = getVariants(card, setFilter);

  let owned = 0;

  variants.forEach(variant => {
    let count = 0;

    if (options.getOwnedCount) {
      count = options.getOwnedCount(variant);
    } else {
      const key = `${card.id}_${variant}`;
      count = Number(userCards[key] || 0);
    }

    if (count > 0) {
      owned++;
    }
  });

  return {
    isComplete: owned === variants.length,
    isPartial: owned > 0 && owned < variants.length,
    isMissing: owned === 0
  };
}
