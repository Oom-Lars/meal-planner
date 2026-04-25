import { useState } from 'react';
import {
  CalendarDaysIcon, ShoppingCartIcon, BookOpenIcon,
  ChartBarIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline';
import { useStore } from './useStore';
import MealPlanView from './components/MealPlanView';
import ShoppingView from './components/ShoppingView';
import MealsView from './components/MealsView';
import SpendingView from './components/SpendingView';
import './App.css';

type Tab = 'plan' | 'shopping' | 'meals' | 'spending';

const TABS = [
  { id: 'plan'     as Tab, label: 'Plan',     Icon: CalendarDaysIcon },
  { id: 'shopping' as Tab, label: 'Shop',     Icon: ShoppingCartIcon },
  { id: 'meals'    as Tab, label: 'Meals',    Icon: BookOpenIcon },
  { id: 'spending' as Tab, label: 'Spending', Icon: ChartBarIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('plan');
  const store = useStore();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = store.importData(ev.target?.result as string);
        if (!ok) alert('Invalid file format');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <ScissorsIcon style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="header-title">Meal Planner</div>
              <div className="header-subtitle">Family Kitchen</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={store.exportData} title="Export data">
              <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            </button>
            <button className="header-btn" onClick={handleImport} title="Import data">
              <ArrowUpTrayIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === 'plan'     && <MealPlanView data={store.data} />}
        {tab === 'shopping' && (
          <ShoppingView
            data={store.data}
            updateItemPrice={store.updateItemPrice}
            updateItemQuantity={store.updateItemQuantity}
            toggleItemChecked={store.toggleItemChecked}
            resetChecks={store.resetChecks}
            addShoppingItem={store.addShoppingItem}
            deleteShoppingItem={store.deleteShoppingItem}
          />
        )}
        {tab === 'meals'    && <MealsView data={store.data} addMeal={store.addMeal} />}
        {tab === 'spending' && <SpendingView data={store.data} />}
      </main>

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <div className="nav-icon-wrap">
              <Icon style={{ width: 22, height: 22 }} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
