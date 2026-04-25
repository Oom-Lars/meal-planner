import type { AppData } from '../types';
import {
  FireIcon, ArrowPathIcon, BoltIcon, StarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
} from '@heroicons/react/24/solid';

interface Props { data: AppData }

function NoteBadge({ note }: { note: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    'Cook':      { cls: 'badge-cook',      icon: <FireIcon className="badge-icon" /> },
    'Leftovers': { cls: 'badge-leftovers', icon: <ArrowPathIcon className="badge-icon" /> },
    'Lazy Day':  { cls: 'badge-lazy',      icon: <BoltIcon className="badge-icon" /> },
    'Treat':     { cls: 'badge-treat',     icon: <StarIcon className="badge-icon" /> },
  };
  const entry = map[note] ?? map['Cook'];
  return (
    <span className={`badge ${entry.cls}`}>
      {entry.icon} {note}
    </span>
  );
}

// Category colour accent per meal — used for the left border stripe
const MEAL_COLOR: Record<string, string> = {
  'spaghetti-bol':          '#ef4444',
  'chicken-stir-fry':       '#f59e0b',
  'pork-chops':             '#8b5cf6',
  'chicken-strips-chips':   '#f59e0b',
  'mushroom-mince-pasta':   '#ef4444',
  'bbq-chicken':            '#f59e0b',
  'pork-fried-rice':        '#8b5cf6',
  'burgers-chips':          '#ef4444',
  'chicken-potato-curry':   '#f59e0b',
  'mince-potato-hash':      '#22c55e',
  'chicken-wraps':          '#3b82f6',
  'sandwiches-noodles':     '#6b7280',
  'pork-sausage-bake':      '#8b5cf6',
  'mince-stuffed-peppers':  '#22c55e',
  'garlic-chicken-tray-bake':'#f59e0b',
};

export default function MealPlanView({ data }: Props) {
  return (
    <div className="view-container">
      <div className="page-header">
        <div className="page-title">Monthly Plan</div>
        <div className="page-subtitle">4 weeks · {data.mealPlan.length} meals</div>
      </div>

      {[1, 2, 3, 4].map(week => {
        const days = data.mealPlan.filter(d => d.week === week);
        return (
          <div key={week} className="week-block">
            <div className="week-block-header">
              <CalendarDaysIcon className="week-block-icon" />
              <span className="week-block-title">Week {week}</span>
              <span className="week-block-count">{days.length} days</span>
            </div>
            {days.map(day => {
              const meal = data.meals.find(m => m.id === day.mealId);
              const accent = MEAL_COLOR[day.mealId] ?? '#16a34a';
              return (
                <div key={day.day} className="day-row" style={{ borderLeft: `3px solid ${accent}` }}>
                  <div className="day-num">{day.day}</div>
                  <span className="meal-name">{meal?.name ?? day.mealId}</span>
                  <NoteBadge note={day.note} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
