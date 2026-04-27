export const UNIT_TYPES = [
  'kg', 'g', 'L', 'ml',
  'head', 'pack', 'packet', 'bag', 'bulb',
  'can', 'bottle', 'box', 'sachet', 'each',
] as const;

export type UnitType = typeof UNIT_TYPES[number];

export interface ParsedQuantity {
  amount: number;
  unit: UnitType;
}

export interface PriceMemory {
  pricePerUnit: number;  // price per 1 unit (e.g. R89.99 per kg)
  unit: UnitType;
  lastPrice: number;     // last total price paid
  lastAmount: number;    // last amount bought
}

export type NoteType = 'Cook' | 'Leftovers' | 'Lazy Day' | 'Treat' | string;

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

export interface MealPlanDay {
  week: number;
  day: number;       // 1-based day within the plan (1–28)
  mealId: string;
  note: NoteType;
}

export interface Ingredient {
  id: string;
  category: string;
  item: string;
  quantity: string;
  notes?: string;
}

export interface ShoppingItem extends Ingredient {
  price?: number;
  checked: boolean;
}

export interface WeekShop {
  week: number;
  items: ShoppingItem[];
}

export interface MonthRecord {
  id: string;          // e.g. "2025-06"
  label: string;       // e.g. "June 2025"
  startDate: string;   // ISO date string of plan day 1
  mealPlan: MealPlanDay[];
  weekShops: WeekShop[];
}

export interface AppData {
  meals: Meal[];
  mealPlan: MealPlanDay[];
  weekShops: WeekShop[];
  months?: MonthRecord[];
  activeMonthId?: string;
  priceMemory?: Record<string, PriceMemory>; // key = item name lowercase
}
