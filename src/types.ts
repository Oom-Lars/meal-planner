export type NoteType = 'Cook' | 'Leftovers' | 'Lazy Day' | 'Treat' | string;

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
}

export interface MealPlanDay {
  week: number;
  day: number;
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

export interface AppData {
  meals: Meal[];
  mealPlan: MealPlanDay[];
  weekShops: WeekShop[];
}
