// Tiny CSV parser sufficient for lesson import. Handles quoted fields, embedded
// commas, and doubled-quote escapes ("" → "). Newlines inside quotes not supported.
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  for (const raw of lines) {
    if (raw.trim() === "") continue;
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inQ) {
        if (ch === '"' && raw[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === ",") { cells.push(cur); cur = ""; }
        else if (ch === '"') { inQ = true; }
        else { cur += ch; }
      }
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  return rows;
}

export function parseDuration(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = s.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return null;
}

export function parseBool(v: string): boolean {
  return /^(true|1|yes|y)$/i.test(v.trim());
}

export const LESSON_CSV_TEMPLATE =
  'title,videoUrl,content,duration,freePreview\n"Intro to the module","https://youtu.be/xxxx","Optional notes",180,true\n"Chapter 1","https://youtu.be/yyyy","",10:30,false\n';
