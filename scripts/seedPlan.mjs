// Run with: node scripts/seedPlan.mjs
// This seeds the correct meal plan into Firebase once.

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
  apiKey:            'AIzaSyB12LY20mFCdPG9eRoZxvmSbxGQbFOzLhU',
  authDomain:        'meal-planner-1e87f.firebaseapp.com',
  projectId:         'meal-planner-1e87f',
  storageBucket:     'meal-planner-1e87f.firebasestorage.app',
  messagingSenderId: '957519289980',
  appId:             '1:957519289980:web:4db63a782e9ba606f5b3f9',
  databaseURL:       'https://meal-planner-1e87f-default-rtdb.europe-west1.firebasedatabase.app',
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

const CORRECT_PLAN = [
  { week: 1, day: 1,  mealId: 'spaghetti-bol',           note: 'Cook' },
  { week: 1, day: 2,  mealId: 'spaghetti-bol',           note: 'Leftovers' },
  { week: 1, day: 3,  mealId: 'chicken-stir-fry',        note: 'Cook' },
  { week: 1, day: 4,  mealId: 'chicken-stir-fry',        note: 'Leftovers' },
  { week: 1, day: 5,  mealId: 'pork-chops',              note: 'Cook' },
  { week: 1, day: 6,  mealId: 'pork-chops',              note: 'Leftovers' },
  { week: 1, day: 7,  mealId: 'chicken-strips-chips',    note: 'Lazy Day' },
  { week: 2, day: 8,  mealId: 'mushroom-mince-pasta',    note: 'Cook' },
  { week: 2, day: 9,  mealId: 'mushroom-mince-pasta',    note: 'Leftovers' },
  { week: 2, day: 10, mealId: 'bbq-chicken',             note: 'Cook' },
  { week: 2, day: 11, mealId: 'bbq-chicken',             note: 'Leftovers' },
  { week: 2, day: 12, mealId: 'pork-fried-rice',         note: 'Cook' },
  { week: 2, day: 13, mealId: 'pork-fried-rice',         note: 'Leftovers' },
  { week: 2, day: 14, mealId: 'burgers-chips',           note: 'Treat' },
  { week: 3, day: 15, mealId: 'chicken-potato-curry',    note: 'Cook' },
  { week: 3, day: 16, mealId: 'chicken-potato-curry',    note: 'Leftovers' },
  { week: 3, day: 17, mealId: 'mince-potato-hash',       note: 'Cook' },
  { week: 3, day: 18, mealId: 'mince-potato-hash',       note: 'Leftovers' },
  { week: 3, day: 19, mealId: 'chicken-wraps',           note: 'Cook' },
  { week: 3, day: 20, mealId: 'chicken-wraps',           note: 'Leftovers' },
  { week: 3, day: 21, mealId: 'sandwiches-noodles',      note: 'Lazy Day' },
  { week: 4, day: 22, mealId: 'pork-sausage-bake',       note: 'Cook' },
  { week: 4, day: 23, mealId: 'pork-sausage-bake',       note: 'Leftovers' },
  { week: 4, day: 24, mealId: 'mince-stuffed-peppers',   note: 'Cook' },
  { week: 4, day: 25, mealId: 'mince-stuffed-peppers',   note: 'Leftovers' },
  { week: 4, day: 26, mealId: 'garlic-chicken-tray-bake',note: 'Cook' },
  { week: 4, day: 27, mealId: 'garlic-chicken-tray-bake',note: 'Leftovers' },
];

async function seed() {
  const dbRef = ref(db, 'mealplanner');
  const snapshot = await get(dbRef);
  const current = snapshot.val() ?? {};

  // Patch only the mealPlan field — leave everything else (meals, weekShops, months etc) untouched
  const updated = { ...current, mealPlan: CORRECT_PLAN };
  await set(dbRef, updated);
  console.log('✅ Meal plan seeded successfully.');
  process.exit(0);
}

seed().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
