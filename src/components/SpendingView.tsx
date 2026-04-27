import type { AppData, MonthRecord } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

interface Props {
  data: AppData;
  setActiveMonth: (id: string) => void;
}

const CAT_COLORS: Record<string, string> = {
  Meat: '#ef4444', Vegetables: '#22c55e', Carbs: '#f59e0b',
  Pantry: '#8b5cf6', Dairy: '#3b82f6', Other: '#6b7280',
};

export default function SpendingView({ data, setActiveMonth }: Props) {
  const months = data.months ?? [];
  const activeId = data.activeMonthId;
  const activeMonth: MonthRecord | undefined =
    months.find(m => m.id === activeId) ?? months[months.length - 1];

  const activeIdx = months.findIndex(m => m.id === activeMonth?.id);
  const canPrev = activeIdx > 0;
  const canNext = activeIdx < months.length - 1;

  // Use active month shops or fall back to legacy
  const weekShops = activeMonth?.weekShops ?? data.weekShops ?? [];

  const weekTotals = weekShops.map(ws => ({
    week: ws.week,
    name: `Wk ${ws.week}`,
    total: ws.items.reduce((s, i) => s + (i.price ?? 0), 0),
    priced: ws.items.filter(i => (i.price ?? 0) > 0).length,
    count: ws.items.length,
    items: ws.items.filter(i => (i.price ?? 0) > 0),
  }));

  const grandTotal = weekTotals.reduce((s, w) => s + w.total, 0);
  const maxTotal = Math.max(...weekTotals.map(w => w.total), 1);

  // Category breakdown across all weeks
  const catTotals: Record<string, number> = {};
  weekShops.forEach(ws => ws.items.forEach(i => {
    if ((i.price ?? 0) > 0) {
      catTotals[i.category] = (catTotals[i.category] ?? 0) + (i.price ?? 0);
    }
  }));
  const catData = Object.entries(catTotals)
    .map(([cat, total]) => ({ cat, total }))
    .sort((a, b) => b.total - a.total);

  // Monthly trend (all months)
  const trendData = months.map(m => ({
    name: m.label.split(' ')[0], // just month name
    total: m.weekShops.reduce((s, ws) => s + ws.items.reduce((ss, i) => ss + (i.price ?? 0), 0), 0),
  }));

  return (
    <div className="view-container">
      {/* Month nav */}
      <div className="month-nav">
        <button className="month-nav-btn" disabled={!canPrev}
          onClick={() => canPrev && setActiveMonth(months[activeIdx - 1].id)}>
          <ChevronLeftIcon style={{ width: 18, height: 18 }} />
        </button>
        <div className="month-nav-label">
          <span className="month-nav-title">{activeMonth?.label ?? 'Spending'}</span>
          <span className="month-nav-sub">Monthly breakdown</span>
        </div>
        <button className="month-nav-btn" disabled={!canNext}
          onClick={() => canNext && setActiveMonth(months[activeIdx + 1].id)}>
          <ChevronRightIcon style={{ width: 18, height: 18 }} />
        </button>
      </div>

      {/* Hero total */}
      <div className="spending-hero">
        <div className="spending-hero-label">Month Total</div>
        <div className="spending-hero-amount">R {grandTotal.toFixed(2)}</div>
        <div className="spending-hero-sub">
          {weekTotals.reduce((s, w) => s + w.priced, 0)} of{' '}
          {weekTotals.reduce((s, w) => s + w.count, 0)} items priced
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="chart-card">
        <div className="chart-title">Weekly Spend</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weekTotals} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `R ${Number(v).toFixed(2)}`} />
            <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly trend (only show if >1 month) */}
      {trendData.length > 1 && (
        <div className="chart-card">
          <div className="chart-title">Monthly Trend</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `R ${Number(v).toFixed(2)}`} />
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5}
                dot={{ fill: '#16a34a', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">By Category</div>
          {catData.map(({ cat, total }) => (
            <div key={cat} className="cat-breakdown-row">
              <div className="cat-breakdown-dot" style={{ background: CAT_COLORS[cat] ?? '#6b7280' }} />
              <span className="cat-breakdown-name">{cat}</span>
              <div className="cat-breakdown-bar-bg">
                <div className="cat-breakdown-bar-fill"
                  style={{ width: `${(total / grandTotal) * 100}%`, background: CAT_COLORS[cat] ?? '#6b7280' }} />
              </div>
              <span className="cat-breakdown-amount">R {total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Per-week detail */}
      <div className="spending-weeks">
        {weekTotals.map(w => (
          <div key={w.week} className="spending-week-card">
            <div className="spending-week-top">
              <div>
                <div className="spending-week-name">Week {w.week}</div>
                <div className="spending-week-meta-text">{w.priced}/{w.count} items priced</div>
              </div>
              <div className="spending-week-amount">R {w.total.toFixed(2)}</div>
            </div>
            <div className="spending-bar-track">
              <div className="spending-bar-fill" style={{ width: `${(w.total / maxTotal) * 100}%` }} />
            </div>
            <div className="spending-items-list">
              {w.items.length > 0
                ? w.items.map(i => (
                    <div key={i.id} className="spending-item-row">
                      <span className="spending-item-name">{i.item}</span>
                      <span className="spending-item-price">R {i.price!.toFixed(2)}</span>
                    </div>
                  ))
                : <div className="spending-empty">No prices entered yet</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
