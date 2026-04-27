import type { UnitType, ParsedQuantity, PriceMemory } from '../types';
import { UNIT_TYPES } from '../types';

/** Parse a quantity string like "1.5 kg", "2 heads", "500g" into amount + unit */
export function parseQuantity(qty: string): ParsedQuantity | null {
  const str = qty.trim().toLowerCase();

  // Try "number unit" pattern
  const match = str.match(/^([\d.]+)\s*(.+)$/);
  if (match) {
    const amount = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    // Normalise common variants
    const unitMap: Record<string, UnitType> = {
      'kg': 'kg', 'kgs': 'kg',
      'g': 'g', 'gr': 'g', 'gram': 'g', 'grams': 'g',
      'l': 'L', 'liter': 'L', 'litre': 'L', 'liters': 'L', 'litres': 'L',
      'ml': 'ml', 'milliliter': 'ml', 'millilitre': 'ml',
      'head': 'head', 'heads': 'head',
      'pack': 'pack', 'packs': 'pack',
      'packet': 'packet', 'packets': 'packet',
      'bag': 'bag', 'bags': 'bag',
      'bulb': 'bulb', 'bulbs': 'bulb',
      'can': 'can', 'cans': 'can',
      'bottle': 'bottle', 'bottles': 'bottle',
      'box': 'box', 'boxes': 'box',
      'sachet': 'sachet', 'sachets': 'sachet',
      'each': 'each',
    };
    const unit = unitMap[rawUnit];
    if (unit && !isNaN(amount)) return { amount, unit };
  }

  // Just a number — treat as "each"
  const num = parseFloat(str);
  if (!isNaN(num)) return { amount: num, unit: 'each' };

  return null;
}

/** Format a ParsedQuantity back to a string */
export function formatQuantity(pq: ParsedQuantity): string {
  return `${pq.amount} ${pq.unit}`;
}

/** Given a price memory entry and a quantity string, calculate the expected total price */
export function calcPriceFromMemory(memory: PriceMemory, qty: string): number | null {
  const parsed = parseQuantity(qty);
  if (!parsed) return null;
  if (parsed.unit !== memory.unit) {
    // Unit mismatch — handle g↔kg and ml↔L conversions
    if (memory.unit === 'kg' && parsed.unit === 'g')
      return memory.pricePerUnit * (parsed.amount / 1000);
    if (memory.unit === 'g' && parsed.unit === 'kg')
      return memory.pricePerUnit * (parsed.amount * 1000);
    if (memory.unit === 'L' && parsed.unit === 'ml')
      return memory.pricePerUnit * (parsed.amount / 1000);
    if (memory.unit === 'ml' && parsed.unit === 'L')
      return memory.pricePerUnit * (parsed.amount * 1000);
    // Different incompatible units — just return last price as a hint
    return memory.lastPrice;
  }
  return memory.pricePerUnit * parsed.amount;
}

/** Build a memory entry from a price + quantity */
export function buildMemoryEntry(price: number, qty: string): PriceMemory | null {
  const parsed = parseQuantity(qty);
  if (!parsed || parsed.amount === 0) return null;
  return {
    pricePerUnit: price / parsed.amount,
    unit: parsed.unit,
    lastPrice: price,
    lastAmount: parsed.amount,
  };
}

export { UNIT_TYPES };
