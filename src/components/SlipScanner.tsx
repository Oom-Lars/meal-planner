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

// Models to try in order — falls back if one is overloaded
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash'];

const PROMPT = `You are a grocery receipt and shopping order parser for South African stores like PnP (Pick n Pay).

Look at this image carefully. It may be:
1. A PnP ASAP app order screenshot — items show as "Product Name Xg/Xml/XL" with a price on the right and "X/X items" below
2. A till slip / receipt — items listed with prices

Extract ALL grocery items. For PnP app screenshots, the quantity and unit are usually embedded in the product name (e.g. "PnP Full Cream Fresh Milk 2L" → quantity: "2 L", item: "Full Cream Milk").

Return ONLY a valid JSON array, no markdown, no explanation. Each object must have:
- "item": string (short clean product name, remove brand prefixes like "PnP" where possible)
- "quantity": string in format "NUMBER UNIT" where UNIT is one of: kg, g, L, ml, head, pack, packet, bag, bulb, can, bottle, box, sachet, each
- "price": number (use the discounted/actual price, not the crossed-out original)
- "category": one of exactly: "Meat", "Vegetables", "Carbs", "Pantry", "Dairy", "Other"

Examples:
[
  {"item":"Full Cream Milk","quantity":"2 L","price":59.00,"category":"Dairy"},
  {"item":"Sliced Brown Bread","quantity":"700 g","price":31.98,"category":"Carbs"},
  {"item":"Robot Peppers","quantity":"3 each","price":44.99,"category":"Vegetables"}
]

If you cannot read the image clearly, return [].`;

export default function SlipScanner({ currentWeek, onConfirm, onClose }: Props) {
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState('');
  const [week, setWeek] = useState(currentWeek);
  const fileRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImage = async (file: File) => {
    setScanning(true);
    setError('');
    setItems([]);

    const mimeType = (file.type === 'image/heic' || file.type === 'image/heif')
      ? 'image/jpeg'
      : (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    let base64: string;
    try {
      base64 = await fileToBase64(file);
    } catch {
      setError('Could not read the image file.');
      setScanning(false);
      return;
    }

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const imageData = { inlineData: { mimeType, data: base64 } };
    let lastError = '';

    for (const modelName of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) await new Promise(r => setTimeout(r, 4000));
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([PROMPT, imageData]);
          const text = result.response.text().trim();
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonStr = cleaned.startsWith('[') ? cleaned : cleaned.match(/\[[\s\S]*\]/)?.[0] ?? '[]';
          const parsed: ParsedItem[] = JSON.parse(jsonStr);
          if (parsed.length === 0) {
            setError('No items found. Make sure the screenshot shows item names and prices clearly.');
          } else {
            setItems(parsed);
          }
          setScanning(false);
          return;
        } catch (e) {
          const msg = (e as Error).message ?? '';
          lastError = msg;
          if (msg.includes('503') || msg.includes('429')) continue;
          break; // non-retryable error — try next model
        }
      }
    }

    // All models failed
    if (lastError.includes('503')) {
      setError('AI is overloaded right now. Please try again in a minute.');
    } else if (lastError.includes('429')) {
      setError('Daily scan limit reached (20/day on free tier). Try again tomorrow.');
    } else if (lastError.includes('404')) {
      setError('AI model unavailable. Please try again shortly.');
    } else if (lastError.includes('403') || lastError.includes('API_KEY')) {
      setError('API key issue — check your Gemini key.');
    } else {
      setError(`Could not read the image: ${lastError.slice(0, 100)}`);
    }
    setScanning(false);
  };

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
            <p className="slip-upload-text">Tap to upload a PnP screenshot or till slip photo</p>
            <p className="slip-upload-sub">Any image format · screenshots work great</p>
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

        {error && (
          <div className="slip-error">
            {error}
            <button className="slip-retry-btn" onClick={() => { setError(''); fileRef.current?.click(); }}>
              Try again
            </button>
          </div>
        )}

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
              <button className="btn-secondary" onClick={() => setItems([])}>
                Rescan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
