import { useState, useEffect } from 'react';
import type { AppData, Meal, ShoppingItem } from './types';
import { defaultData } from './data';

const STORAGE_KEY = 'meal-planner-data';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    // ignore parse errors, fall back to defaults
  }
  return defaultData;
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useStore() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateItemQuantity = (week: number, itemId: string, quantity: string) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, quantity } : i) }
          : ws
      ),
    }));
  };

  const updateItemPrice = (week: number, itemId: string, price: number) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, price } : i) }
          : ws
      ),
    }));
  };

  const toggleItemChecked = (week: number, itemId: string) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
          : ws
      ),
    }));
  };

  const resetChecks = (week: number) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => ({ ...i, checked: false })) }
          : ws
      ),
    }));
  };

  const addMeal = (meal: Meal) => {
    setData(prev => ({
      ...prev,
      meals: [...prev.meals, meal],
    }));
  };

  const addShoppingItem = (week: number, item: ShoppingItem) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week ? { ...ws, items: [...ws.items, item] } : ws
      ),
    }));
  };

  const updateShoppingItem = (week: number, item: ShoppingItem) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.map(i => i.id === item.id ? item : i) }
          : ws
      ),
    }));
  };

  const deleteShoppingItem = (week: number, itemId: string) => {
    setData(prev => ({
      ...prev,
      weekShops: prev.weekShops.map(ws =>
        ws.week === week
          ? { ...ws, items: ws.items.filter(i => i.id !== itemId) }
          : ws
      ),
    }));
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

  const importData = (json: string) => {
    try {
      const parsed = JSON.parse(json) as AppData;
      setData(parsed);
      return true;
    } catch {
      return false;
    }
  };

  return {
    data,
    updateItemQuantity,
    updateItemPrice,
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
