import { useState } from 'react';
import {
  CalendarDaysIcon, ShoppingCartIcon, BookOpenIcon,
  ChartBarIcon, ScissorsIcon, ArrowRightStartOnRectangleIcon, CameraIcon,
} from '@heroicons/react/24/outline';
import { useStore } from './useStore';
import { useAuth } from './useAuth';
import { currentWeekInMonth } from './utils/dateUtils';
import MealPlanView from './components/MealPlanView';
import ShoppingView from './components/ShoppingView';
import MealsView from './components/MealsView';
import SpendingView from './components/SpendingView';
import LoginScreen from './components/LoginScreen';
import SlipScanner from './components/SlipScanner';
import ErrorBoundary from './components/ErrorBoundary';
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
  const [highlightMealId, setHighlightMealId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const { user, loading, denied, signIn, signOut } = useAuth();
  const store = useStore();

  const handleMealClick = (mealId: string) => {
    setHighlightMealId(mealId);
    setTab('meals');
  };

  const activeMonth = store.activeMonth();
  const currentWeek = activeMonth ? currentWeekInMonth(activeMonth) : 1;

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo"><ScissorsIcon style={{ width: 32, height: 32 }} /></div>
        <div className="splash-spinner" />
      </div>
    );
  }

  if (!user) return <LoginScreen onSignIn={signIn} denied={denied} />;

  return (
    <ErrorBoundary>
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <ScissorsIcon style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="header-title">Meal Planner</div>
              <div className="header-subtitle">{user.displayName ?? 'Family Kitchen'}</div>
            </div>
          </div>
          <div className="header-actions">
            {!store.synced && <div className="sync-dot" title="Syncing..." />}
            <button className="header-btn" onClick={() => setShowScanner(true)} title="Scan till slip">
              <CameraIcon style={{ width: 16, height: 16 }} />
            </button>
            <button className="header-btn" onClick={signOut} title="Sign out">
              <ArrowRightStartOnRectangleIcon style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === 'plan' && (
          <MealPlanView
            data={store.data}
            upsertMonth={store.upsertMonth}
            setActiveMonth={store.setActiveMonth}
            deleteMonth={store.deleteMonth}
            onMealClick={handleMealClick}
          />
        )}
        {tab === 'shopping' && (
          <ShoppingView
            data={store.data}
            setActiveMonth={store.setActiveMonth}
            updateItemPrice={store.updateItemPrice}
            updateItemQuantity={store.updateItemQuantity}
            toggleItemChecked={store.toggleItemChecked}
            resetChecks={store.resetChecks}
            addShoppingItem={store.addShoppingItem}
            deleteShoppingItem={store.deleteShoppingItem}
          />
        )}
        {tab === 'meals' && (
          <MealsView
            data={store.data}
            addMeal={store.addMeal}
            updateMeal={store.updateMeal}
            highlightMealId={highlightMealId}
            onHighlightClear={() => setHighlightMealId(null)}
          />
        )}
        {tab === 'spending' && (
          <SpendingView data={store.data} setActiveMonth={store.setActiveMonth} />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <div className="nav-icon-wrap"><Icon style={{ width: 22, height: 22 }} /></div>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {showScanner && (
        <SlipScanner
          currentWeek={currentWeek}
          onConfirm={store.addShoppingItems}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
