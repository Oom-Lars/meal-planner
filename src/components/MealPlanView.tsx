import { useState } from 'react';
import type { AppData, MonthRecord, MealPlanDay } from '../types';
import {
  CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon,
  SparklesIcon, FireIcon, ArrowPathIcon, BoltIcon, StarIcon,
  PencilSquareIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { planDayToDate, formatDayLabel, createMonthRecord, generateMealPlan, buildWeekShopsFromPlan } from '../utils/dateUtils';

interface Props {
  data: AppData;
  upsertMonth: (m: MonthRecord) => void;
  setActiveMonth: (id: string) => void;
  deleteMonth: (id: string) => void;
  onMealClick: (mealId: string) => void;
}

function NoteBadge({ note }: { note: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    'Cook':      { cls: 'badge-cook',      icon: <FireIcon className="badge-icon" /> },
    'Leftovers': { cls: 'badge-leftovers', icon: <ArrowPathIcon className="badge-icon" /> },
    'Lazy Day':  { cls: 'badge-lazy',      icon: <BoltIcon className="badge-icon" /> },
    'Treat':     { cls: 'badge-treat',     icon: <StarIcon className="badge-icon" /> },
  };
  const entry = map[note] ?? map['Cook'];
  return <span className={`badge ${entry.cls}`}>{entry.icon} {note}</span>;
}

const MEAL_COLORS: Record<string, string> = {
  'spaghetti-bol':'#ef4444','chicken-stir-fry':'#f59e0b','pork-chops':'#8b5cf6',
  'chicken-strips-chips':'#f59e0b','mushroom-mince-pasta':'#ef4444','bbq-chicken':'#f59e0b',
  'pork-fried-rice':'#8b5cf6','burgers-chips':'#ef4444','chicken-potato-curry':'#f59e0b',
  'mince-potato-hash':'#22c55e','chicken-wraps':'#3b82f6','sandwiches-noodles':'#6b7280',
  'pork-sausage-bake':'#8b5cf6','mince-stuffed-peppers':'#22c55e','garlic-chicken-tray-bake':'#f59e0b',
};

export default function MealPlanView({ data, upsertMonth, setActiveMonth, deleteMonth, onMealClick }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [draftPlan, setDraftPlan] = useState<MealPlanDay[]>([]);
  const [swappingDay, setSwappingDay] = useState<number | null>(null);

  const months = data.months ?? [];
  const activeId = data.activeMonthId;
  const activeMonth = months.find(m => m.id === activeId) ?? months[months.length - 1];

  const activeIdx = months.findIndex(m => m.id === activeMonth?.id);
  const canPrev = activeIdx > 0;
  const canNext = activeIdx < months.length - 1;

  const handleCreateMonth = () => {
    if (!pickerDate) return;
    const mealIds = [...data.meals].reverse().map(m => m.id);
    const month = createMonthRecord(pickerDate, mealIds, data.meals);
    upsertMonth(month);
    setShowDatePicker(false);
    setShowDeleteConfirm(false);
    setShowGenerator(false);
    setPickerDate('');
  };

  // Regenerate the active month's plan with fresh randomisation, preserving existing shop items
  const handleRegenerate = () => {
    const mealIds = [...data.meals].reverse().map(m => m.id);
    setDraftPlan(generateMealPlan(mealIds));
    setShowGenerator(true);
  };

  const handleGenerate = () => {
    const mealIds = [...data.meals].reverse().map(m => m.id);
    setDraftPlan(generateMealPlan(mealIds));
    setShowGenerator(true);
  };

  const handleSwapMeal = (dayIdx: number, mealId: string) => {
    setDraftPlan(p => p.map((d, i) => i === dayIdx ? { ...d, mealId } : d));
    setSwappingDay(null);
  };

  const handleConfirmPlan = () => {
    if (!activeMonth) return;
    const newWeekShops = buildWeekShopsFromPlan(draftPlan, data.meals, activeMonth.weekShops);
    upsertMonth({ ...activeMonth, mealPlan: draftPlan, weekShops: newWeekShops });
    setShowGenerator(false);
  };

  const handleDeleteMonth = () => {
    if (!activeMonth) return;
    deleteMonth(activeMonth.id);
    setShowDeleteConfirm(false);
  };

  // Use legacy data if no months set up yet
  const mealPlan = activeMonth?.mealPlan ?? data.mealPlan;
  const startDate = activeMonth?.startDate;

  if (!activeMonth && months.length === 0) {
    return (
      <div className="view-container">
        <div className="page-header">
          <div className="page-title">Monthly Plan</div>
          <div className="page-subtitle">Set a start date to begin</div>
        </div>
        <div className="empty-state">
          <CalendarDaysIcon style={{ width: 48, height: 48 }} className="empty-icon" />
          <p>No plan yet. Pick your payday start date to create your first month.</p>
          <button className="btn-primary" onClick={() => setShowDatePicker(true)}>
            Pick Start Date
          </button>
        </div>
        {showDatePicker && (
          <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-title">Choose Plan Start Date</div>
              <p className="modal-desc">Pick the date your monthly plan begins (usually the weekend after payday).</p>
              <input type="date" className="form-input" value={pickerDate}
                onChange={e => setPickerDate(e.target.value)} />
              <div className="form-actions">
                <button className="btn-primary" onClick={handleCreateMonth}>Create Plan</button>
                <button className="btn-secondary" onClick={() => setShowDatePicker(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Month nav bar */}
      <div className="month-nav">
        <button className="month-nav-btn" disabled={!canPrev}
          onClick={() => canPrev && setActiveMonth(months[activeIdx - 1].id)}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </button>
        <div className="month-nav-label">
          <span className="month-nav-title">{activeMonth?.label ?? 'Plan'}</span>
          {startDate && (
            <span className="month-nav-sub">
              From {new Date(startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        <button className="month-nav-btn" disabled={!canNext}
          onClick={() => canNext && setActiveMonth(months[activeIdx + 1].id)}>
          <ChevronRightIcon style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Action buttons */}
      <div className="plan-actions">
        <button className="plan-action-btn" onClick={() => setShowDatePicker(true)}>
          <CalendarDaysIcon style={{ width: 16, height: 16 }} /> New Month
        </button>
        {activeMonth && (
          <button className="plan-action-btn" onClick={handleRegenerate}>
            <ArrowPathIcon style={{ width: 16, height: 16 }} /> Regenerate
          </button>
        )}
        <button className="plan-action-btn primary" onClick={handleGenerate}>
          <SparklesIcon style={{ width: 16, height: 16 }} /> Generate Plan
        </button>
        {activeMonth && (
          <button className="plan-action-btn danger" onClick={() => setShowDeleteConfirm(true)}>
            <TrashIcon style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Week blocks */}
      {[1, 2, 3, 4].map(week => {
        const days = mealPlan.filter(d => d.week === week);
        return (
          <div key={week} className="week-block">
            <div className="week-block-header">
              <CalendarDaysIcon className="week-block-icon" />
              <span className="week-block-title">Week {week}</span>
              <span className="week-block-count">{days.length} days</span>
            </div>
            {days.map(day => {
              const meal = data.meals.find(m => m.id === day.mealId);
              const accent = MEAL_COLORS[day.mealId] ?? '#16a34a';
              const date = startDate ? planDayToDate(startDate, day.day) : null;
              return (
                <div key={day.day} className="day-row" style={{ borderLeft: `3px solid ${accent}` }}>
                  <div className="day-num-wrap">
                    <div className="day-num">{day.day}</div>
                    {date && <div className="day-date">{formatDayLabel(date)}</div>}
                  </div>
                  <button className="meal-name-btn" onClick={() => onMealClick(day.mealId)}>
                    {meal?.name ?? day.mealId}
                  </button>
                  <NoteBadge note={day.note} />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Date picker modal */}
      {showDatePicker && (
        <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">New Month Plan</div>
            <p className="modal-desc">Pick the start date for the new month (your payday weekend).</p>
            <input type="date" className="form-input" value={pickerDate}
              onChange={e => setPickerDate(e.target.value)} />
            <div className="form-actions">
              <button className="btn-primary" onClick={handleCreateMonth}>Create</button>
              <button className="btn-secondary" onClick={() => setShowDatePicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate plan modal */}
      {showGenerator && (
        <div className="modal-overlay">
          <div className="modal-card modal-tall">
            <div className="modal-header">
              <div className="modal-title">
                <SparklesIcon style={{ width: 18, height: 18 }} /> Generated Plan
              </div>
              <button className="modal-close" onClick={() => setShowGenerator(false)}>
                ✕
              </button>
            </div>
            <p className="modal-desc">Tap any meal to swap it. Confirm when happy.</p>
            <div className="gen-plan-list">
              {draftPlan.map((day, idx) => {
                const meal = data.meals.find(m => m.id === day.mealId);
                return (
                  <div key={idx} className="gen-plan-row">
                    <span className="gen-day-num">Day {day.day}</span>
                    {swappingDay === idx ? (
                      <select className="form-select gen-select"
                        value={day.mealId}
                        onChange={e => handleSwapMeal(idx, e.target.value)}
                        autoFocus>
                        {data.meals.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <button className="gen-meal-btn" onClick={() => setSwappingDay(idx)}>
                        {meal?.name ?? day.mealId}
                        <PencilSquareIcon style={{ width: 13, height: 13, opacity: 0.5 }} />
                      </button>
                    )}
                    <span className={`badge badge-${day.note.toLowerCase().replace(' ', '-')}`}>
                      {day.note}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={handleConfirmPlan}>Confirm Plan</button>
              <button className="btn-secondary" onClick={() => setShowGenerator(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <TrashIcon style={{ width: 18, height: 18, color: 'var(--red)' }} />
              Delete {activeMonth?.label}?
            </div>
            <p className="modal-desc">
              This will permanently remove this month's plan and shopping lists. This cannot be undone.
            </p>
            <div className="form-actions">
              <button className="btn-danger" onClick={handleDeleteMonth}>Yes, Delete</button>
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
