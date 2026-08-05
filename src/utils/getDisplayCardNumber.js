export function getDisplayCardNumber(card) {
  const id = String(card?.id || '').trim();
  const setCode = String(card?.set_code || '').trim();

  if (!id) {
    return card?.number ?? '';
  }

  const expectedPrefix = setCode
    ? `${setCode}-`
    : '';

  if (
    expectedPrefix &&
    id.toLowerCase().startsWith(
      expectedPrefix.toLowerCase()
    )
  ) {
    return id.substring(expectedPrefix.length);
  }

  const separatorIndex = id.indexOf('-');

  if (separatorIndex >= 0) {
    return id.substring(separatorIndex + 1);
  }

  return card?.number ?? '';
}
