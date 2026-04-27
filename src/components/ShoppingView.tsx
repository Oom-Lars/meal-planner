import { useState } from 'react';
import type { AppData, ShoppingItem } from '../types';
import { UNIT_TYPES } from '../types';
import {
  CheckCircleIcon, PlusIcon, TrashIcon, ArrowPathIcon,
  ChevronLeftIcon, ChevronRightIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { safeItems } from '../utils/dateUtils';
import { parseQuantity, formatQuantity } from '../utils/priceUtils';

interface Props {
  data: AppData;
  setActiveMonth: (id: string) => void;
  updateItemPrice: (week: number, itemId: string, price: number) => void;
  updateItemQuantity: (week: number, itemId: string, quantity: string) => void;
  toggleItemChecked: (week: number, itemId: string) => void;
  resetChecks: (week: number) => void;
  addShoppingItem: (week: number, item: ShoppingItem) => void;
  deleteShoppingItem: (week: number, itemId: string) => void;
  getSuggestedPrice: (itemName: string, quantity: string) => number | null;
}

const CATEGORIES = ['Meat', 'Vegetables', 'Carbs', 'Pantry', 'Dairy', 'Other'];

export default function ShoppingView({
  data, setActiveMonth,
  updateItemPrice, updateItemQuantity, toggleItemChecked,
  resetChecks, addShoppingItem, deleteShoppingItem, getSuggestedPrice,
}: Props) {
  const [activeWeek, setActiveWeek] = useState(1);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [pricePerKgInput, setPricePerKgInput] = useState('');
  const [editingQty, setEditingQty] = useState<string | null>(null);
  const [qtyInput, setQtyInput] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ category: 'Vegetables', item: '', qtyAmount: '1', qtyUnit: 'each' as typeof UNIT_TYPES[number], notes: '' });

  // Month nav
  const months = data.months ?? [];
  const activeId = data.activeMonthId;
  const activeMonth = months.find(m => m.id === activeId) ?? months[months.length - 1];
  const activeIdx = months.findIndex(m => m.id === activeMonth?.id);
  const canPrev = activeIdx > 0;
  const canNext = activeIdx < months.length - 1;

  // Use active month's weekShops, fall back to legacy
  const weekShops = activeMonth?.weekShops ?? data.weekShops ?? [];
  const shopItems = safeItems(weekShops, activeWeek);
  const shop = { week: activeWeek, items: shopItems };

  const parseKg = (quantity: string): number | null => {
    const rangeMatch = quantity.match(/([\d.]+)[–-]([\d.]+)\s*kg/i);
    if (rangeMatch) return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
    const kgMatch = quantity.match(/([\d.]+)\s*kg/i);
    if (kgMatch) return parseFloat(kgMatch[1]);
    const gMatch = quantity.match(/([\d.]+)\s*g\b/i);
    if (gMatch) return parseFloat(gMatch[1]) / 1000;
    return null;
  };

  const calcPriceFromKg = (itemQty: string) => {
    const perKg = parseFloat(pricePerKgInput);
    if (isNaN(perKg) || perKg <= 0) return;
    const kg = parseKg(itemQty);
    if (kg) setPriceInput((perKg * kg).toFixed(2));
  };

  const grouped = CATEGORIES.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const items = shop.items.filter(i => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  shop.items.forEach(i => {
    if (!CATEGORIES.includes(i.category)) {
      grouped[i.category] = [...(grouped[i.category] ?? []), i];
    }
  });

  const total = shop.items.reduce((s, i) => s + (i.price ?? 0), 0);
  const checked = shop.items.filter(i => i.checked).length;

  const savePriceAndClose = (itemId: string) => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val >= 0) updateItemPrice(activeWeek, itemId, val);
    setEditingPrice(null);
    setPriceInput('');
    setPricePerKgInput('');
  };

  const openPriceEdit = (item: ShoppingItem) => {
    const suggested = getSuggestedPrice(item.item, item.quantity);
    setEditingPrice(item.id);
    setPriceInput(item.price != null && item.price > 0 ? item.price.toString() : suggested ? suggested.toFixed(2) : '');
    setPricePerKgInput('');
  };

  const saveQtyAndClose = (itemId: string) => {
    if (qtyInput.trim()) updateItemQuantity(activeWeek, itemId, qtyInput.trim());
    setEditingQty(null);
    setQtyInput('');
  };

  const handleAddItem = () => {
    if (!newItem.item.trim()) return;
    const quantity = `${newItem.qtyAmount} ${newItem.qtyUnit}`;
    const suggested = getSuggestedPrice(newItem.item, quantity);
    addShoppingItem(activeWeek, {
      id: `custom-${Date.now()}`,
      category: newItem.category,
      item: newItem.item.trim(),
      quantity,
      notes: newItem.notes.trim() || undefined,
      price: suggested ?? undefined,
      checked: false,
    });
    setNewItem({ category: 'Vegetables', item: '', qtyAmount: '1', qtyUnit: 'each', notes: '' });
    setShowAddItem(false);
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <div className="page-title">Shopping List</div>
        <div className="page-subtitle">Tap items to check off · tap price to edit</div>
      </div>

      {/* Month nav */}
      {months.length > 0 && (
        <div className="month-nav">
          <button className="month-nav-btn" disabled={!canPrev}
            onClick={() => canPrev && setActiveMonth(months[activeIdx - 1].id)}>
            <ChevronLeftIcon style={{ width: 18, height: 18 }} />
          </button>
          <div className="month-nav-label">
            <span className="month-nav-title">{activeMonth?.label ?? 'Shopping'}</span>
            <span className="month-nav-sub">Shopping list</span>
          </div>
          <button className="month-nav-btn" disabled={!canNext}
            onClick={() => canNext && setActiveMonth(months[activeIdx + 1].id)}>
            <ChevronRightIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      )}

      <div className="week-tabs">
        {[1, 2, 3, 4].map(w => (
          <button key={w} className={`week-tab ${activeWeek === w ? 'active' : ''}`} onClick={() => setActiveWeek(w)}>
            Week {w}
          </button>
        ))}
      </div>

      <div className="shop-summary">
        <div className="summary-left">
          <div className="summary-label">Progress</div>
          <div className="summary-progress">{checked}/{shop.items.length} items</div>
        </div>
        <div className="summary-divider" />
        <div className="summary-right">
          <div className="summary-total-label">Total</div>
          <div className="summary-total-amount">R {total.toFixed(2)}</div>
        </div>
        <button className="summary-reset" onClick={() => resetChecks(activeWeek)} title="Reset all checks">
          <ArrowPathIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className={`category-section cat-${cat.replace(/\s+/g, '')}`}>
          <div className="category-header">
            <div className="category-dot" />
            <span className="category-label">{cat}</span>
            <span className="category-count">{items.length}</span>
          </div>
          {items.map(item => (
            <div key={item.id} className={`shop-item ${item.checked ? 'checked' : ''}`}>
              <button
                className={`check-btn ${item.checked ? 'is-checked' : ''}`}
                onClick={() => toggleItemChecked(activeWeek, item.id)}
              >
                {item.checked
                  ? <CheckCircleSolid style={{ width: 22, height: 22 }} />
                  : <CheckCircleIcon style={{ width: 22, height: 22 }} />}
              </button>

              <div className="item-info">
                <div className="item-name">{item.item}</div>
                <div className="item-meta">
                  {editingQty === item.id ? (
                    <div className="qty-edit-wrap">
                      <input
                        className="qty-input qty-num"
                        type="number"
                        value={qtyInput.split(' ')[0] ?? ''}
                        onChange={e => {
                          const unit = qtyInput.split(' ')[1] ?? 'kg';
                          setQtyInput(`${e.target.value} ${unit}`);
                        }}
                        min="0"
                        step="0.1"
                        autoFocus
                      />
                      <select
                        className="qty-unit-select"
                        value={qtyInput.split(' ')[1] ?? 'kg'}
                        onChange={e => {
                          const num = qtyInput.split(' ')[0] ?? '1';
                          setQtyInput(`${num} ${e.target.value}`);
                        }}
                        onBlur={() => saveQtyAndClose(item.id)}
                      >
                        {UNIT_TYPES.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  ) : (
                    <button
                      className="qty-btn"
                      onClick={() => {
                        const parsed = parseQuantity(item.quantity);
                        setEditingQty(item.id);
                        setQtyInput(parsed ? formatQuantity(parsed) : item.quantity);
                      }}
                    >
                      {item.quantity}
                    </button>
                  )}
                  {item.notes && <span className="item-note-tag">{item.notes}</span>}
                </div>
              </div>

              <div>
                {editingPrice === item.id ? (
                  <div className="price-edit-panel">
                    {cat === 'Meat' && (
                      <div className="pkg-row">
                        <div className="price-edit-wrap pkg-input-wrap">
                          <span className="currency-sym">R</span>
                          <input type="number" className="price-input" placeholder="per kg"
                            value={pricePerKgInput}
                            onChange={e => setPricePerKgInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && calcPriceFromKg(item.quantity)}
                            min="0" step="0.01" />
                          <span className="pkg-label">/kg</span>
                        </div>
                        <button className="pkg-calc-btn" onClick={() => calcPriceFromKg(item.quantity)} title="Calculate">=</button>
                      </div>
                    )}
                    <div className="price-edit-wrap">
                      <span className="currency-sym">R</span>
                      <input type="number" className="price-input" placeholder="total"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        onBlur={() => savePriceAndClose(item.id)}
                        onKeyDown={e => e.key === 'Enter' && savePriceAndClose(item.id)}
                        autoFocus={cat !== 'Meat'} min="0" step="0.01" />
                    </div>
                  </div>
                ) : (
                  <button className="price-btn" onClick={() => openPriceEdit(item)}>
                    {item.price != null && item.price > 0
                      ? `R ${item.price.toFixed(2)}`
                      : getSuggestedPrice(item.item, item.quantity)
                        ? <span className="price-suggested">
                            <SparklesIcon style={{ width: 11, height: 11 }} />
                            R {getSuggestedPrice(item.item, item.quantity)!.toFixed(2)}
                          </span>
                        : <span className="price-empty">+ price</span>}
                  </button>
                )}
              </div>

              <button className="delete-btn" onClick={() => deleteShoppingItem(activeWeek, item.id)}>
                <TrashIcon style={{ width: 15, height: 15 }} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {showAddItem ? (
        <div className="form-card">
          <div className="form-card-title">Add Item</div>
          <select className="form-select" value={newItem.category}
            onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="form-input" placeholder="Item name *" value={newItem.item}
            onChange={e => setNewItem(p => ({ ...p, item: e.target.value }))} />
          <div className="form-row">
            <input className="form-input" type="number" placeholder="Amount" value={newItem.qtyAmount}
              onChange={e => setNewItem(p => ({ ...p, qtyAmount: e.target.value }))}
              style={{ flex: '0 0 80px' }} min="0" step="0.1" />
            <select className="form-select" value={newItem.qtyUnit}
              onChange={e => setNewItem(p => ({ ...p, qtyUnit: e.target.value as typeof UNIT_TYPES[number] }))}>
              {UNIT_TYPES.map(u => <option key={u}>{u}</option>)}
            </select>
            <input className="form-input" placeholder="Notes (optional)" value={newItem.notes}
              onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAddItem}>Add Item</button>
            <button className="btn-secondary" onClick={() => setShowAddItem(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="add-item-btn" onClick={() => setShowAddItem(true)}>
          <PlusIcon style={{ width: 18, height: 18 }} /> Add Item
        </button>
      )}
    </div>
  );
}
