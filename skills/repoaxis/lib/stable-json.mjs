function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const key of Object.keys(value).sort()) output[key] = sortValue(value[key]);
  return output;
}

export function stableStringify(value, space = 2) {
  return `${JSON.stringify(sortValue(value), null, space)}\n`;
}
