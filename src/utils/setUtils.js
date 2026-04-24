import { SET_CONFIG } from "./setConfig";

export function isSecretCard(card, setCode) {
  const config = SET_CONFIG[setCode];
  if (!config) return false;

  const number = parseInt(card.number, 10);
  return number > config.standard;
}
