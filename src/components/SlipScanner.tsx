import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ShoppingItem } from '../types';
import {
  CameraIcon, XMarkIcon, CheckIcon, ArrowPathIcon, TrashIcon,
} from '@heroicons/react/24/outline';

interface Props {
  currentWeek: number;
  onConfirm: (week: number, items: ShoppingItem[]) => void;
  onClose: () => void;
}

interface ParsedItem {
  item: string;
  quantity: string;
  price: number;
  category: string;
}

const CATEGORIES = ['Meat', 'Vegetables', 'Carbs', 'Pantry', 'Dairy', 'Other'];

export default function SlipScanner({ currentWeek, onConfirm, onClose }: Props) {
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState('');
  const [week, setWeek] = useState(currentWeek);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (file: File) => {
    setScanning(true);
    setError('');
    setItems([]);
    try {
      const base64 = await fileToBase64(file);
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a grocery receipt parser. Look at this till slip or shopping screenshot and extract all grocery items.
Return ONLY a valid JSON array, no markdown, no explanation. Each object must have:
- "item": string (product name, keep it short)
- "quantity": string (e.g. "1", "2 kg", "500g", "1 pack")
- "price": number (the price paid, as a number)
- "category": one of exactly: "Meat", "Vegetables", "Carbs", "Pantry", "Dairy", "Other"

Example: [{"item":"Chicken breast","quantity":"1 kg","price":89.99,"category":"Meat"}]

If you cannot read the slip clearly, return an empty array [].`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp', data: base64 } },
      ]);

      const text = result.response.text().trim();
      const jsonStr = text.startsWith('[') ? text : text.match(/\[[\s\S]*\]/)?.[0] ?? '[]';
      const parsed: ParsedItem[] = JSON.parse(jsonStr);
      setItems(parsed);
    } catch (e) {
      setError('Could not read the slip. Try a clearer photo.');
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const updateItem = (idx: number, field: keyof ParsedItem, value: string | number) =>
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const removeItem = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    const shopItems: ShoppingItem[] = items.map(it => ({
      id: `slip-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      category: it.category,
      item: it.item,
      quantity: it.quantity,
      price: it.price,
      checked: true,
    }));
    onConfirm(week, shopItems);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-tall">
        <div className="modal-header">
          <div className="modal-title">
            <CameraIcon style={{ width: 18, height: 18 }} /> Scan Till Slip
          </div>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div className="slip-week-row">
          <span className="slip-week-label">Add to week:</span>
          <div className="week-tabs" style={{ flex: 1 }}>
            {[1, 2, 3, 4].map(w => (
              <button key={w} className={`week-tab ${week === w ? 'active' : ''}`}
                onClick={() => setWeek(w)}>Week {w}</button>
            ))}
          </div>
        </div>

        {items.length === 0 && !scanning && (
          <div className="slip-upload-area" onClick={() => fileRef.current?.click()}>
            <CameraIcon style={{ width: 36, height: 36, color: 'var(--text-light)' }} />
            <p className="slip-upload-text">Tap to upload a till slip or shopping screenshot</p>
            <p className="slip-upload-sub">JPG, PNG or WebP</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
          </div>
        )}

        {scanning && (
          <div className="slip-scanning">
            <ArrowPathIcon style={{ width: 28, height: 28 }} className="spin-icon" />
            <p>Reading your slip with AI...</p>
          </div>
        )}

        {error && <div className="slip-error">{error}</div>}

        {items.length > 0 && (
          <>
            <p className="slip-found-label">{items.length} items found — review before saving:</p>
            <div className="slip-items-list">
              {items.map((it, idx) => (
                <div key={idx} className="slip-item-row">
                  <select className="form-select slip-cat-select" value={it.category}
                    onChange={e => updateItem(idx, 'category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <div className="slip-item-fields">
                    <input className="form-input" value={it.item}
                      onChange={e => updateItem(idx, 'item', e.target.value)} placeholder="Item" />
                    <div className="slip-item-row2">
                      <input className="form-input" value={it.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        placeholder="Qty" style={{ flex: 1 }} />
                      <div className="price-edit-wrap" style={{ flex: 1 }}>
                        <span className="currency-sym">R</span>
                        <input type="number" className="price-input" value={it.price}
                          onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <button className="delete-btn" onClick={() => removeItem(idx)}>
                    <TrashIcon style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleConfirm}>
                <CheckIcon style={{ width: 16, height: 16 }} /> Add {items.length} Items
              </button>
              <button className="btn-secondary" onClick={() => { setItems([]); }}>
                Rescan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
