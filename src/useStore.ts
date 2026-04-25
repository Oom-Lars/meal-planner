import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import type { AppData, Meal, ShoppingItem } from './types';
import { defaultData } from './data';
import { db } from './firebase';

const DB_PATH = 'mealplanner';

export function useStore() {
  const [data, setData] = useState<AppData>(defaultData);
  const [synced, setSynced] = useState(false);

  // Subscribe to Firebase — updates in real time across all devices
  useEffect(() => {
    const dbRef = ref(db, DB_PATH);
    const unsub = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val() as AppData);
      } else {
        // First time — write the default data to Firebase
        set(dbRef, defaultData);
      }
      setSynced(true);
    });
    return unsub;
  }, []);

  // Write full data back to Firebase on every change (after initial sync)
  const persist = (updated: AppData) => {
    setData(updated);
    set(ref(db, DB_PATH), updated);
  };

  const updateItemPrice = (week: number, itemId: string, price: number) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, price } : i) }
          : ws
      ),
    });
  };

  const updateItemQuantity = (week: number, itemId: string, quantity: string) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, quantity } : i) }
          : ws
      ),
    });
  };

  const toggleItemChecked = (week: number, itemId: string) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
          : ws
      ),
    });
  };

  const resetChecks = (week: number) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => ({ ...i, checked: false })) }
          : ws
      ),
    });
  };

  const addMeal = (meal: Meal) => {
    persist({ ...data, meals: [...data.meals, meal] });
  };

  const addShoppingItem = (week: number, item: ShoppingItem) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week ? { ...ws, items: [...ws.items, item] } : ws
      ),
    });
  };

  const updateShoppingItem = (week: number, item: ShoppingItem) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === item.id ? item : i) }
          : ws
      ),
    });
  };

  const deleteShoppingItem = (week: number, itemId: string) => {
    persist({
      ...data,
      weekShops: data.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.filter(i => i.id !== itemId) }
          : ws
      ),
    });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal-planner-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppData;
      persist(parsed);
      return true;
    } catch {
      return false;
    }
  };

  return {
    data,
    synced,
    updateItemPrice,
    updateItemQuantity,
    toggleItemChecked,
    resetChecks,
    addMeal,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    exportData,
    importData,
  };
}
