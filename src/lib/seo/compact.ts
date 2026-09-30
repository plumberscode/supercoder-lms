function shrink(value: unknown, maxArray: number, maxString: number): unknown {
  if (typeof value === "string") {
    return value.length > maxString ? `${value.slice(0, maxString)}…` : value;
  }
  if (Array.isArray(value)) {
    const items = value.slice(0, maxArray).map((v) => shrink(v, maxArray, maxString));
    if (value.length > maxArray) items.push(`…(+${value.length - maxArray} item lagi)`);
    return items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, shrink(v, maxArray, maxString)]),
    );
  }
  return value;
}

/**
 * JSON untuk dikirim ke LLM, maksimal `max` karakter. Array & string panjang dipangkas
 * bertahap dulu supaya strukturnya tetap valid; baru dipotong kasar sebagai upaya terakhir.
 */
export function compactJson(value: unknown, max = 8000): string {
  let json = JSON.stringify(value);
  if (json.length <= max) return json;
  for (const [arr, str] of [
    [40, 400],
    [20, 300],
    [10, 200],
    [5, 120],
  ] as const) {
    json = JSON.stringify(shrink(value, arr, str));
    if (json.length <= max) return json;
  }
  return `${json.slice(0, max)}…[dipotong]`;
}
