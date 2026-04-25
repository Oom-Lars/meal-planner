import type { AppData } from '../types';

interface Props { data: AppData }

export default function SpendingView({ data }: Props) {
  const weekTotals = data.weekShops.map(ws => ({
    week: ws.week,
    total: ws.items.reduce((s, i) => s + (i.price ?? 0), 0),
    priced: ws.items.filter(i => (i.price ?? 0) > 0).length,
    count: ws.items.length,
    items: ws.items.filter(i => (i.price ?? 0) > 0),
  }));

  const grandTotal = weekTotals.reduce((s, w) => s + w.total, 0);
  const maxTotal = Math.max(...weekTotals.map(w => w.total), 1);
  const totalItems = data.weekShops.reduce((s, ws) => s + ws.items.length, 0);
  const pricedItems = data.weekShops.reduce((s, ws) => s + ws.items.filter(i => (i.price ?? 0) > 0).length, 0);

  return (
    <div className="view-container">
      <div className="page-header">
        <div className="page-title">Spending</div>
        <div className="page-subtitle">Track your monthly grocery budget</div>
      </div>

      <div className="spending-hero">
        <div className="spending-hero-label">Monthly Total</div>
        <div className="spending-hero-amount">R {grandTotal.toFixed(2)}</div>
        <div className="spending-hero-sub">{pricedItems} of {totalItems} items priced</div>
      </div>

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
              <div
                className="spending-bar-fill"
                style={{ width: `${(w.total / maxTotal) * 100}%` }}
              />
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
