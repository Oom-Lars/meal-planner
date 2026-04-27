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
  // Legacy flat fields kept for backward compat, new data uses months[]
  mealPlan: MealPlanDay[];
  weekShops: WeekShop[];
  months?: MonthRecord[];
  activeMonthId?: string;
}
