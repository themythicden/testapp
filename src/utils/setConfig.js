export const SET_CONFIG = {
  sv9: {
    name: "Journey Together",
    standard: 159,
    extra:31,

    views: {
      standard: ["normal", "holo"],
      parallel: ["normal", "holo", "reverse"],
      master: "all"
    },

    variants: {
      common: ["normal", "reverse"],
      uncommon: ["normal", "reverse"],
      rare: ["holo", "reverse"],
      default: ["normal"]
    }
  },

  sv8pt5: {
    name: "Prismatic Evolutions",
    standard: 131,
    extra: 49,

    views: {
      standard: ["normal", "holo"],
      parallel: ["normal","holo","reverse"],
      pokeball: ["normal", "holo", "reverse", "pokeball"],
      masterball: ["normal", "holo", "reverse", "pokeball", "masterball"],
      master: "all"
    },

    variants: {
      common: ["normal", "reverse", "pokeball", "masterball"],
      uncommon: ["normal", "reverse", "pokeball", "masterball"],
      rare: ["holo", "reverse", "pokeball"],
      trainer: ["normal"],

      default: ["normal"]
    }
  },

  me2pt5: {
    name: "Mega Evolutions",

    standard: 120,

    views: {
      standard: ["normal", "holo"],
      energy: ["normal", "holo", "reverse", "energy"],
      pokeball: ["normal", "holo", "reverse", "energy", "pokeball"],
      master: "all"
    },

    variants: {
      common: ["normal", "reverse", "energy", "pokeball"],
      uncommon: ["normal", "reverse", "energy", "pokeball"],
      rare: ["holo", "reverse", "energy"],
      trainer: ["normal", "reverse", "pokeball"],

      default: ["normal"]
    }
  }
};
