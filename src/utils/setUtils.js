import { SETS } from "./setConfig";

export function getSetInfo(setCode) {
  return SETS[setCode] || null;
}

export function isSecretCard(card, setCode) {
  const set = getSetInfo(setCode);
  if (!set) return false;

  return Number(card.number) > set.base;
}
