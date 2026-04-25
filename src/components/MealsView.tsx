import { useState } from 'react';
import type { AppData, Meal, Ingredient } from '../types';
import {
  ChevronDownIcon, PlusIcon, TrashIcon,
  BeakerIcon, FireIcon, GlobeAltIcon, ArchiveBoxIcon,
  CubeIcon, SparklesIcon,
} from '@heroicons/react/24/outline';

interface Props { data: AppData; addMeal: (meal: Meal) => void }

const CATEGORIES = ['Meat', 'Vegetables', 'Carbs', 'Pantry', 'Dairy', 'Other'];

// Icon per category for the meal card icon area
const CAT_ICONS: Record<string, React.ReactNode> = {
  'Meat':       <FireIcon className="meal-type-icon" />,
  'Vegetables': <BeakerIcon className="meal-type-icon" />,
  'Carbs':      <CubeIcon className="meal-type-icon" />,
  'Pantry':     <ArchiveBoxIcon className="meal-type-icon" />,
  'Dairy':      <GlobeAltIcon className="meal-type-icon" />,
  'Other':      <SparklesIcon className="meal-type-icon" />,
};

// Derive a representative icon from the first ingredient's category
function getMealIcon(meal: Meal) {
  const firstCat = meal.ingredients[0]?.category ?? 'Other';
  return CAT_ICONS[firstCat] ?? CAT_ICONS['Other'];
}

export default function MealsView({ data, addMeal }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id'>[]>([
    { category: 'Meat', item: '', quantity: '', notes: '' },
  ]);

  const toggle = (id: string) => setExpanded(p => p === id ? null : id);

  const updateIng = (idx: number, field: string, value: string) =>
    setIngredients(p => p.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));

  const handleSave = () => {
    if (!mealName.trim()) return;
    const valid = ingredients.filter(i => i.item.trim());
    if (!valid.length) return;
    addMeal({
      id: `meal-${Date.now()}`,
      name: mealName.trim(),
      ingredients: valid.map((ing, idx) => ({ ...ing, id: `ing-${Date.now()}-${idx}` })),
    });
    setMealName('');
    setIngredients([{ category: 'Meat', item: '', quantity: '', notes: '' }]);
    setShowForm(false);
  };

  return (
    <div className="view-container">
      <div className="page-header">
        <div className="page-title">Meals</div>
        <div className="page-subtitle">{data.meals.length} recipes in your collection</div>
      </div>

      <div className="meals-grid">
        {data.meals.map(meal => {
          const isOpen = expanded === meal.id;
          return (
            <div key={meal.id} className="meal-card">
              <button className="meal-card-header" onClick={() => toggle(meal.id)}>
                <div className="meal-card-icon">
                  {getMealIcon(meal)}
                </div>
                <div className="meal-card-info">
                  <div className="meal-card-name">{meal.name}</div>
                  <div className="meal-card-meta">{meal.ingredients.length} ingredients</div>
                </div>
                <ChevronDownIcon className={`meal-card-chevron ${isOpen ? 'open' : ''}`} />
              </button>

              {isOpen && (
                <div className="meal-ingredients">
                  {meal.ingredients.map(ing => (
                    <div key={ing.id} className="ingredient-row">
                      <span className={`ing-cat-pill ing-${ing.category.replace(/\s+/g, '')}`}>
                        {ing.category}
                      </span>
                      <span className="ing-name">{ing.item}</span>
                      <span className="ing-qty">{ing.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showForm ? (
        <div className="form-card">
          <div className="form-card-title">New Meal</div>
          <input className="form-input" placeholder="Meal name *" value={mealName}
            onChange={e => setMealName(e.target.value)} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="form-row">
                <select className="form-select" value={ing.category}
                  onChange={e => updateIng(idx, 'category', e.target.value)}
                  style={{ flex: '0 0 auto', width: 110 }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="form-input" placeholder="Item *" value={ing.item}
                  onChange={e => updateIng(idx, 'item', e.target.value)} />
                <input className="form-input" placeholder="Qty" value={ing.quantity}
                  onChange={e => updateIng(idx, 'quantity', e.target.value)}
                  style={{ flex: '0 0 72px' }} />
                <button className="delete-btn" onClick={() =>
                  setIngredients(p => p.filter((_, i) => i !== idx))}>
                  <TrashIcon style={{ width: 15, height: 15 }} />
                </button>
              </div>
            ))}
          </div>

          <button className="add-ing-btn" onClick={() =>
            setIngredients(p => [...p, { category: 'Vegetables', item: '', quantity: '', notes: '' }])}>
            <PlusIcon style={{ width: 14, height: 14 }} /> Add Ingredient
          </button>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave}>Save Meal</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="add-item-btn" onClick={() => setShowForm(true)}>
          <PlusIcon style={{ width: 18, height: 18 }} /> Add New Meal
        </button>
      )}
    </div>
  );
}
