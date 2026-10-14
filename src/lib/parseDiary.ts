export type ParsedDay = {
  date: string; // "RRRR-MM-DD"
  weight_kg: number | null;
  waist_cm: number | null;
  steps: number | null;
  fasting: boolean;
  notes: string | null;
};

const MONTHS: Record<string, number> = {
  stycznia: 1,
  styczeń: 1,
  lutego: 2,
  luty: 2,
  marca: 3,
  marzec: 3,
  kwietnia: 4,
  kwiecień: 4,
  maja: 5,
  maj: 5,
  czerwca: 6,
  czerwiec: 6,
  lipca: 7,
  lipiec: 7,
  sierpnia: 8,
  sierpień: 8,
  września: 9,
  wrzesień: 9,
  października: 10,
  październik: 10,
  listopada: 11,
  listopad: 11,
  grudnia: 12,
  grudzień: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

// "103,7kg" -> 103.7 ; "95kg" -> 95 ; "" -> null
const num = (raw: string): number | null => {
  const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

// nowy dzień: "14 kwietnia 2026", "01 maj 2026 - start"
const DAY_RE = /^\s*(\d{1,2})\s+([A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)\s+2026\b/;
// nagłówek zakresu: "04 - 11 sierpień 2026 - urlop..."
const RANGE_HEADER_RE =
  /^\s*\d{1,2}\s*-\s*\d{1,2}\s+[A-Za-ząćęłńóśźż]+\s+2026\b/i;
// linia zbiorcza z urlopu: "04.08 - 10950"
const STEP_LINE_RE = /^\s*(\d{2})\.(\d{2})\s*-\s*(\d+)/;

const WEIGHT_RE = /^waga:\s*(.+)$/i;
const WAIST_RE = /^pas:\s*(.+)$/i;
const STEPS_RE = /^krok(?:i|ów):\s*(.+)$/i; // łapie "Kroki:" i "Kroków:"
const NOTE_RE = /^(uwagi|samopoczucie):\s*(.+)$/i;

export function parseDiary(text: string): ParsedDay[] {
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;
  const flush = () => {
    if (current) {
      days.push(current);
      current = null;
    }
  };

  for (const line of text.split("\n")) {
    // (a) linia "04.08 - 10950" -> osobny dzień, same kroki
    const step = line.match(STEP_LINE_RE);
    if (step) {
      flush();
      days.push({
        date: `2026-${step[2]}-${step[1]}`,
        weight_kg: null,
        waist_cm: null,
        steps: Number(step[3]),
        fasting: false,
        notes: null,
      });
      continue;
    }

    // (b) nagłówek zakresu -> ignorujemy (dane są w liniach DD.MM poniżej)
    if (RANGE_HEADER_RE.test(line)) {
      flush();
      continue;
    }

    // (c) nowy dzień
    const day = line.match(DAY_RE);
    if (day) {
      flush();
      const month = MONTHS[day[2].toLowerCase()];
      if (!month) continue; // nieznany miesiąc -> pomiń bezpiecznie
      current = {
        date: `2026-${pad(month)}-${pad(Number(day[1]))}`,
        weight_kg: null,
        waist_cm: null,
        steps: null,
        fasting: false,
        notes: null,
      };
      continue;
    }

    // (d) linie pól -> tylko gdy jesteśmy wewnątrz dnia; reszta (treningi!) leci w kosz
    if (!current) continue;

    const w = line.match(WEIGHT_RE);
    if (w) {
      current.weight_kg = num(w[1]);
      continue;
    }

    const p = line.match(WAIST_RE);
    if (p) {
      current.waist_cm = pickWaist(p[1]);
      continue;
    }

    const s = line.match(STEPS_RE);
    if (s) {
      const n = num(s[1]);
      current.steps = n === null ? null : Math.round(n);
      continue;
    }

    const nt = line.match(NOTE_RE);
    if (nt) {
      const t = nt[2].trim();
      current.notes = current.notes ? `${current.notes} · ${t}` : t;
      if (detectFasting(t)) current.fasting = true;
      continue;
    }
  }
  flush();
  return days;
}

function pickWaist(raw: string): number | null {
  const parts = raw.split("-");
  return num(parts[parts.length - 1]);
}

function detectFasting(text: string): boolean {
  return text.toLowerCase().includes("post");
}
