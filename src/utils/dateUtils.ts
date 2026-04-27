import type { MonthRecord, MealPlanDay, WeekShop, Meal, ShoppingItem } from '../types';

export function planDayToDate(startDate: string, dayIndex: number): Date {
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayIndex - 1);
  return d;
}

export function currentWeekInMonth(month: MonthRecord): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(month.startDate);
  start.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) return 1;
  return Math.min(Math.max(Math.floor(diffDays / 7) + 1, 1), 4);
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateMealPlan(mealIds: string[]): MealPlanDay[] {
  const mid = Math.ceil(mealIds.length / 2);
  const pool = [...shuffle(mealIds.slice(0, mid)), ...shuffle(mealIds.slice(mid))];
  const plan: MealPlanDay[] = [];
  let mealIdx = 0;
  let week = 1;
  let dayInWeek = 0;

  for (let day = 1; day <= 28; day++) {
    dayInWeek++;
    if (dayInWeek > 7) { dayInWeek = 1; week++; }
    const isLastDay = dayInWeek === 7;
    const prev = plan[plan.length - 1];
    const isLeftover = prev && prev.note === 'Cook' && dayInWeek % 2 === 0;

    if (isLastDay) {
      plan.push({ week, day, mealId: pool[mealIdx % pool.length], note: day === 14 ? 'Treat' : 'Lazy Day' });
      mealIdx++;
    } else if (isLeftover) {
      plan.push({ week, day, mealId: prev.mealId, note: 'Leftovers' });
    } else {
      plan.push({ week, day, mealId: pool[mealIdx % pool.length], note: 'Cook' });
      mealIdx++;
    }
  }
  return plan;
}

export function buildWeekShopsFromPlan(
  plan: MealPlanDay[],
  meals: Meal[],
  existingWeekShops?: WeekShop[],
): WeekShop[] {
  return [1, 2, 3, 4].map(week => {
    const existing = existingWeekShops?.find(ws => ws.week === week);
    if (existing && (existing.items ?? []).length > 0) {
      return { week, items: existing.items ?? [] };
    }
    const mealIds = [...new Set(
      plan.filter(d => d.week === week && d.note === 'Cook').map(d => d.mealId)
    )];
    const itemMap = new Map<string, ShoppingItem>();
    mealIds.forEach(mealId => {
      const meal = meals.find(m => m.id === mealId);
      if (!meal) return;
      meal.ingredients.forEach(ing => {
        const key = ing.item.toLowerCase().trim();
        if (itemMap.has(key)) {
          const ex = itemMap.get(key)!;
          ex.notes = ex.notes ? `${ex.notes} + ${ing.quantity}` : `+ ${ing.quantity} (${meal.name})`;
        } else {
          itemMap.set(key, {
            id: `gen-w${week}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            category: ing.category,
            item: ing.item,
            quantity: ing.quantity,
            notes: ing.notes,
            checked: false,
          });
        }
      });
    });
    return { week, items: Array.from(itemMap.values()) };
  });
}

export function safeItems(weekShops: WeekShop[] | undefined, week: number): ShoppingItem[] {
  return weekShops?.find(w => w.week === week)?.items ?? [];
}

export function createMonthRecord(startDate: string, mealIds: string[], meals: Meal[]): MonthRecord {
  const d = new Date(startDate);
  const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const mealPlan = generateMealPlan(mealIds);
  return {
    id,
    label: formatMonthLabel(d),
    startDate,
    mealPlan,
    weekShops: buildWeekShopsFromPlan(mealPlan, meals),
  };
}
