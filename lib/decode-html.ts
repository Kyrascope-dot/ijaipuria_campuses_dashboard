const el = typeof document !== "undefined" ? document.createElement("textarea") : null;

export function decodeHTML(str: string): string {
  if (!str) return str;
  if (el) {
    el.innerHTML = str;
    return el.value;
  }
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
