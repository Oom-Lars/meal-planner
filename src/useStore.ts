import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import type { AppData, Meal, ShoppingItem, MonthRecord } from './types';
import { defaultData } from './data';
import { db } from './firebase';
import { buildMemoryEntry, calcPriceFromMemory } from './utils/priceUtils';

const DB_PATH = 'mealplanner';

/** Remove all undefined values recursively so Firebase doesn't reject them */
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function useStore() {
  const [data, setData] = useState<AppData>(defaultData);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const dbRef = ref(db, DB_PATH);
    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val() as AppData);
      } else {
        set(dbRef, defaultData);
      }
      setSynced(true);
    });
    return unsub;
  }, []);

  const persist = (updated: AppData) => {
    const clean = stripUndefined(updated);
    setData(clean);
    set(ref(db, DB_PATH), clean);
  };

  // ── Active month helpers ──
  const activeMonth = (): MonthRecord | undefined => {
    if (!data.months?.length) return undefined;
    return data.months.find(m => m.id === data.activeMonthId) ?? data.months[data.months.length - 1];
  };

  const upsertMonth = (month: MonthRecord) => {
    const months = [...(data.months ?? [])];
    const idx = months.findIndex(m => m.id === month.id);
    if (idx >= 0) months[idx] = month;
    else months.push(month);

    // If this is the first month being created and legacy data exists,
    // migrate it as a "Month 0" entry so it appears in analytics history
    const hasLegacy = (data.mealPlan?.length ?? 0) > 0;
    const alreadyMigrated = months.some(m => m.id === 'legacy');
    if (hasLegacy && !alreadyMigrated && months.length === 1) {
      const legacyMonth: MonthRecord = {
        id: 'legacy',
        label: 'Previous Month',
        startDate: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
        mealPlan: data.mealPlan ?? [],
        weekShops: data.weekShops ?? [],
      };
      months.unshift(legacyMonth);
    }

    persist({ ...data, months, activeMonthId: month.id });
  };

  const setActiveMonth = (id: string) => persist({ ...data, activeMonthId: id });

  const deleteMonth = (id: string) => {
    const months = (data.months ?? []).filter(m => m.id !== id);
    const activeMonthId = months.length > 0 ? months[months.length - 1].id : undefined;
    persist({ ...data, months, activeMonthId });
  };

  // ── Shopping ──
  const getShop = (week: number): ShoppingItem[] => {
    const am = activeMonth();
    if (am) return am.weekShops.find(w => w.week === week)?.items ?? [];
    return data.weekShops.find(w => w.week === week)?.items ?? [];
  };

  const updateMonthShop = (week: number, items: ShoppingItem[]) => {
    const am = activeMonth();
    if (am) {
      upsertMonth({
        ...am,
        weekShops: am.weekShops.map(ws => ws.week === week ? { ...ws, items } : ws),
      });
    } else {
      persist({
        ...data,
        weekShops: data.weekShops.map(ws => ws.week === week ? { ...ws, items } : ws),
      });
    }
  };

  const updateItemPrice = (week: number, itemId: string, price: number) => {
    const shopItems = getShop(week);
    const item = shopItems.find(i => i.id === itemId);
    // Save to price memory
    const newMemory = { ...(data.priceMemory ?? {}) };
    if (item && price > 0) {
      const entry = buildMemoryEntry(price, item.quantity);
      if (entry) newMemory[item.item.toLowerCase().trim()] = entry;
    }
    const items = shopItems.map(i => i.id === itemId ? { ...i, price } : i);
    const am = activeMonth();
    if (am) {
      const months = [...(data.months ?? [])];
      const idx = months.findIndex(m => m.id === am.id);
      if (idx >= 0) {
        months[idx] = { ...am, weekShops: am.weekShops.map(ws => ws.week === week ? { ...ws, items } : ws) };
      }
      persist({ ...data, months, activeMonthId: data.activeMonthId, priceMemory: newMemory });
    } else {
      persist({
        ...data,
        weekShops: data.weekShops.map(ws => ws.week === week ? { ...ws, items } : ws),
        priceMemory: newMemory,
      });
    }
  };

  const updateItemQuantity = (week: number, itemId: string, quantity: string) => {
    const items = getShop(week).map(i => i.id === itemId ? { ...i, quantity } : i);
    updateMonthShop(week, items);
  };

  const toggleItemChecked = (week: number, itemId: string) => {
    const items = getShop(week).map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    updateMonthShop(week, items);
  };

  const resetChecks = (week: number) => {
    const items = getShop(week).map(i => ({ ...i, checked: false }));
    updateMonthShop(week, items);
  };

  const addShoppingItem = (week: number, item: ShoppingItem) => {
    const items = [...getShop(week), item];
    updateMonthShop(week, items);
  };

  const deleteShoppingItem = (week: number, itemId: string) => {
    const items = getShop(week).filter(i => i.id !== itemId);
    updateMonthShop(week, items);
  };

  const addShoppingItems = (week: number, newItems: ShoppingItem[]) => {
    const items = [...getShop(week), ...newItems];
    updateMonthShop(week, items);
  };

  /** Look up suggested price for an item based on memory */
  const getSuggestedPrice = (itemName: string, quantity: string): number | null => {
    const memory = data.priceMemory?.[itemName.toLowerCase().trim()];
    if (!memory) return null;
    return calcPriceFromMemory(memory, quantity);
  };

  // ── Meals ──
  const addMeal = (meal: Meal) => persist({ ...data, meals: [...data.meals, meal] });

  const updateMeal = (meal: Meal) => {
    persist({ ...data, meals: data.meals.map(m => m.id === meal.id ? meal : m) });
  };

  // ── Export / Import ──
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'meal-planner-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (json: string): boolean => {
    try { persist(JSON.parse(json) as AppData); return true; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (_e) { return false; }
  };

  return {
    data, synced,
    activeMonth,
    getSuggestedPrice,
    upsertMonth, setActiveMonth, deleteMonth,
    updateItemPrice, updateItemQuantity,
    toggleItemChecked, resetChecks,
    addShoppingItem, addShoppingItems, deleteShoppingItem,
    addMeal, updateMeal,
    exportData, importData,
  };
}
