
import React, { useState, useEffect, useRef } from 'react';
import { CookingMethod, PrepMethod, PlayerState, Recipe, Order, RecipeCategory, MarketItem, OrderStatus, DayState, Tool, Table } from './types';
import { INITIAL_RECIPES, INITIAL_TOOLS, LEVEL_THRESHOLDS, MARKET_ITEMS } from './constants';
import { ChefHat, Coins, Sparkles, UtensilsCrossed, ShoppingBag, Lock, Menu, Check, BookOpen, Star, AlertCircle, Flame, Waves, Zap, Clock, Play, Pause, RotateCcw, Trash2, PlusCircle, LayoutGrid, Scissors, Droplets, Egg, ChevronRight, ArrowUpCircle, Users } from 'lucide-react';

const METHOD_NAMES: Record<CookingMethod, string> = {
    [CookingMethod.CUT]: '冷盘',
    [CookingMethod.FRY]: '煎炒',
    [CookingMethod.STEW]: '炖煮',
    [CookingMethod.BAKE]: '烘烤'
};

const PREP_NAMES: Record<PrepMethod, string> = {
    [PrepMethod.CHOP]: '切配',
    [PrepMethod.WASH]: '清洗',
    [PrepMethod.MIX]: '搅拌'
};

const CATEGORY_NAMES: Record<RecipeCategory, string> = {
    APPETIZER: '前菜',
    MAIN: '主菜',
    SOUP: '汤品',
    DESSERT: '甜点',
    DRINK: '饮品'
};

// 10 Minutes real time = 10 Hours game time (10:00 to 20:00)
// 600 seconds = 600 minutes
// 1 sec = 1 min
const DAY_START_MINUTES = 600; // 10:00
const DAY_END_MINUTES = 1200; // 20:00

export default function App() {
  // --- CORE STATE ---
  const [player, setPlayer] = useState<PlayerState>({
    gold: 500, 
    xp: 0,
    level: 1,
    skillPoints: 1, 
    // Unlocked at start: One of each category
    unlockedRecipes: ['tomato_salad', 'fried_egg', 'mushroom_soup', 'orange_juice', 'pudding'],
    unlockedPrepMethods: [PrepMethod.CHOP, PrepMethod.MIX], // Start with Knife and Bowl
    activeMenu: ['tomato_salad', 'fried_egg', 'mushroom_soup', 'orange_juice', 'pudding'],
    tools: INITIAL_TOOLS,
    inventory: { '番茄': 10, '罗勒': 10, '橄榄油': 10, '鸡蛋': 20, '盐': 10, '蘑菇': 10, '奶油': 10, '洋葱': 5, '水果': 10, '糖': 10, '冰块': 10, '牛奶': 10 },
    maxPrepSlots: 2,
    maxCookSlots: 2
  });

  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]); // The tickets/dishes in kitchen
  
  // Table State
  const [tables, setTables] = useState<Table[]>([
      { id: 1, isOccupied: false, customerPatience: 0, maxPatience: 100, orders: [], servedOrders: [], totalBill: 0 },
      { id: 2, isOccupied: false, customerPatience: 0, maxPatience: 100, orders: [], servedOrders: [], totalBill: 0 },
      { id: 3, isOccupied: false, customerPatience: 0, maxPatience: 100, orders: [], servedOrders: [], totalBill: 0 },
      { id: 4, isOccupied: false, customerPatience: 0, maxPatience: 100, orders: [], servedOrders: [], totalBill: 0 },
  ]);

  // --- GAMEPLAY STATE ---
  const [dayState, setDayState] = useState<DayState>({
      isActive: false,
      gameTime: DAY_START_MINUTES,
      earnings: 0,
      customersServed: 0
  });

  const [activeTab, setActiveTab] = useState<'kitchen' | 'menu' | 'shop'>('kitchen');
  const [shopTab, setShopTab] = useState<'tools' | 'market'>('market');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'warn' | 'info'} | null>(null);

  // Interaction State
  const [draggedDish, setDraggedDish] = useState<string | null>(null); // For SERVING (order ID)
  
  // Menu Categories
  const [menuCategory, setMenuCategory] = useState<RecipeCategory | 'ALL'>('ALL');

  // --- REFS ---
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- HELPERS ---
  const showNotification = (msg: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getIngredientCost = (ingName: string) => MARKET_ITEMS.find(i => i.name === ingName)?.cost || 10;
  const getIngredientEmoji = (name: string) => MARKET_ITEMS.find(i => i.name === name)?.emoji || '📦';

  const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = Math.floor(minutes % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const checkIngredients = (recipe: Recipe): { hasAll: boolean, missing: string[] } => {
      const missing: string[] = [];
      const counts: Record<string, number> = {};
      recipe.ingredients.forEach(ing => { counts[ing] = (counts[ing] || 0) + 1; });
      
      for (const ing in counts) {
          if ((player.inventory[ing] || 0) < counts[ing]) {
              missing.push(ing);
          }
      }
      return { hasAll: missing.length === 0, missing };
  };

  // --- GAME LOGIC ---

  const startDay = () => {
      if (player.activeMenu.length < 5) {
          showNotification("菜单太少！至少需要5种菜品来应对组合点餐。", "warn");
          return;
      }
      setDayState({ isActive: true, gameTime: DAY_START_MINUTES, earnings: 0, customersServed: 0 });
      setActiveOrders([]);
      setTables(prev => prev.map(t => ({ ...t, isOccupied: false, orders: [], servedOrders: [], totalBill: 0 })));
      setDraggedDish(null);
  };

  const endDay = () => {
      setDayState(prev => ({ ...prev, isActive: false }));
      showNotification(`今日打烊！总收入: ${dayState.earnings}金币`, 'success');
      // Clear kitchen but keep served money
      setActiveOrders([]); 
      setTables(prev => prev.map(t => ({ ...t, isOccupied: false, orders: [], servedOrders: [] })));
      setDraggedDish(null);
  };

  // MAIN GAME LOOP
  useEffect(() => {
      // Always clear old loop when dependencies change
      if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
      }

      if (!dayState.isActive) return;

      gameLoopRef.current = setInterval(() => {
          // 1. Time Progression (1 sec real time = 1 min game time)
          setDayState(prev => {
              const nextTime = prev.gameTime + 1;
              if (nextTime >= DAY_END_MINUTES) {
                  // End of day reached; trigger closing flow once
                  setTimeout(() => endDay(), 0);
                  return { ...prev, isActive: false, gameTime: DAY_END_MINUTES };
              }
              return { ...prev, gameTime: nextTime };
          });

          // 2. Spawn Customers
          setTables(prevTables => {
              if (Math.random() > 0.05) return prevTables; // ~5% chance per second

              const emptyTable = prevTables.find(t => !t.isOccupied);
              if (!emptyTable) return prevTables;

              const menuRecipes = recipes.filter(r => player.activeMenu.includes(r.id));
              if (menuRecipes.length === 0) return prevTables;

              const apps = menuRecipes.filter(r => r.category === 'APPETIZER');
              const mains = menuRecipes.filter(r => r.category === 'MAIN' || r.category === 'SOUP');
              const others = menuRecipes.filter(r => r.category === 'DESSERT' || r.category === 'DRINK');

              const r1 = apps.length > 0 ? apps[Math.floor(Math.random() * apps.length)] : menuRecipes[0];
              const r2 = mains.length > 0 ? mains[Math.floor(Math.random() * mains.length)] : menuRecipes[0];
              const r3 = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : menuRecipes[0];

              const orderList = [r1.id, r2.id, r3.id].filter(Boolean);
              const bill = orderList.reduce((sum, id) => sum + (recipes.find(r => r.id === id)?.basePrice || 0), 0);

              return prevTables.map(t => {
                  if (t.id === emptyTable.id) {
                      return {
                          ...t,
                          isOccupied: true,
                          customerPatience: 100,
                          orders: orderList,
                          servedOrders: [],
                          totalBill: bill
                      };
                  }
                  return t;
              });
          });

          // 3. Patience Decay & Auto-Leave
          setTables(prev => prev.map(t => {
              if (!t.isOccupied) return t;
              const newPatience = t.customerPatience - 0.05; // Slower decay for 3 dishes
              if (newPatience <= 0) {
                  showNotification(`桌号${t.id} 的客人等得不耐烦走了!`, 'warn');
                  return { ...t, isOccupied: false, orders: [], servedOrders: [] };
              }
              return { ...t, customerPatience: newPatience };
          }));

      }, 1000);

      return () => {
          if (gameLoopRef.current) {
              clearInterval(gameLoopRef.current);
              gameLoopRef.current = null;
          }
      };
  }, [dayState.isActive, recipes, player.activeMenu, player.tools]);


  // --- INTERACTIONS ---

  // START COOKING (From Ticket)
  const startOrder = (tableId: number, recipeId: string) => {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      const check = checkIngredients(recipe);
      if (!check.hasAll) {
          showNotification(`缺: ${check.missing.join(',')}`, 'warn');
          return;
      }
      
      if (!player.unlockedPrepMethods.includes(recipe.prepMethod)) {
          showNotification(`未解锁工具: ${PREP_NAMES[recipe.prepMethod]}`, 'warn');
          return;
      }

      setPlayer(prev => {
          const newInv = {...prev.inventory};
          recipe.ingredients.forEach(ing => newInv[ing] = (newInv[ing] || 0) - 1);
          return {...prev, inventory: newInv};
      });

      const newOrder: Order = {
          id: `ord_${Date.now()}_${Math.random()}`,
          tableId: tableId,
          recipeId: recipeId,
          status: OrderStatus.READY,
          progress: 100,
          stationId: 0
      };

      setActiveOrders(prev => [...prev, newOrder]);
      setDraggedDish(newOrder.id);
  };

  const handleOrderClick = (order: Order) => {
      const recipe = recipes.find(r => r.id === order.recipeId);
      if (!recipe) return;

      if (order.status === OrderStatus.READY) {
          if (draggedDish === order.id) {
              setDraggedDish(null); // Cancel drag
          } else {
              setDraggedDish(order.id); // Pick up
          }
      }
      else if (order.status === OrderStatus.BURNT) {
          setActiveOrders(prev => prev.filter(o => o.id !== order.id));
          showNotification("倒掉了糊菜...", 'info');
      }
  };

  // DELIVER TO TABLE
  const handleTableClick = (table: Table) => {
      if (!draggedDish) return;
      
      const order = activeOrders.find(o => o.id === draggedDish);
      if (!order) return;

      // Verify correct table
      if (table.id !== order.tableId) {
          showNotification("不是这桌点的菜！", 'warn');
          return;
      }

      // Verify if duplicate (already served this dish type? We allow duplicates if ordered)
      // Actually the Table.orders is a list of recipeIds needed. 
      // We need to match one.
      
      // Check how many of this recipe are needed vs served
      const neededCount = table.orders.filter(rid => rid === order.recipeId).length;
      const servedCount = table.servedOrders.filter(rid => rid === order.recipeId).length;

      if (servedCount >= neededCount) {
          showNotification("这桌已经不缺这个菜了！", 'warn');
          return;
      }

      // DELIVER SUCCESS
      setTables(prev => prev.map(t => {
          if (t.id === table.id) {
              const newServed = [...t.servedOrders, order.recipeId];
              const allDone = newServed.length >= t.orders.length;
              
              if (allDone) {
                  // CHECKOUT
                  const tip = Math.floor(t.customerPatience / 5); // Bonus for speed
                  const totalGain = t.totalBill + tip;
                  
                  setPlayer(p => ({
                      ...p, 
                      gold: p.gold + totalGain,
                      xp: p.xp + (newServed.length * 15)
                  }));
                  setDayState(d => ({
                      ...d,
                      earnings: d.earnings + totalGain,
                      customersServed: d.customersServed + 1
                  }));
                  showNotification(`桌号${t.id} 用餐愉快! +${totalGain}G`, 'success');
                  
                  // Clear table
                  return { ...t, isOccupied: false, orders: [], servedOrders: [] };
              } else {
                  return { ...t, servedOrders: newServed };
              }
          }
          return t;
      }));

      // Remove from kitchen
      setActiveOrders(prev => prev.filter(o => o.id !== order.id));
      setDraggedDish(null);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
      setActiveOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  // --- 3D RENDERERS ---

  const renderDishToken = (order: Order) => {
      const recipe = recipes.find(r => r.id === order.recipeId);
      if (!recipe) return null;

      const isDragged = draggedDish === order.id;

      return (
          <button
              key={order.id}
              onClick={(e) => { e.stopPropagation(); handleOrderClick(order); }}
              className={`px-3 py-2 rounded-2xl border-2 shadow-md transition-transform text-left min-w-[140px]
                  ${isDragged ? 'bg-green-600 text-white scale-105 border-green-500' : 'bg-white text-stone-800 border-stone-200 hover:-translate-y-1'}`}
          >
              <div className="flex items-center justify-between gap-2">
                  <span className="text-lg">🍽️</span>
                  <span className="text-[11px] font-mono text-stone-500">拖拽送餐</span>
              </div>
              <div className="font-bold text-sm mt-1">{recipe.name}</div>
          </button>
      );
  };

  const renderTable = (table: Table) => {
      const isOccupied = table.isOccupied;
      const tableOrders = activeOrders.filter(o => o.tableId === table.id && o.status !== OrderStatus.BURNT);

      const servedTracker: Record<string, number> = {};
      table.servedOrders.forEach(rid => { servedTracker[rid] = (servedTracker[rid] || 0) + 1; });
      const readyTracker: Record<string, number> = {};
      tableOrders.forEach(o => { if (o.status === OrderStatus.READY) readyTracker[o.recipeId] = (readyTracker[o.recipeId] || 0) + 1; });

      return (
          <div key={table.id} className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              <div
                  onClick={() => handleTableClick(table)}
                  className={`relative w-[240px] h-[240px] rounded-full shadow-2xl border-8 transition-colors duration-300 flex items-center justify-center ${isOccupied ? 'bg-amber-100 border-amber-300 cursor-pointer' : 'bg-stone-700 border-stone-600 text-stone-200'}`}
              >
                  <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/40"></div>
                  {isOccupied ? (
                      <div className="flex flex-col items-center gap-2">
                          <Users className="text-stone-800" size={48} />
                          <div className="text-xl font-bold text-stone-800">桌号 {table.id}</div>
                          <div className="w-40 h-2 bg-white/40 rounded-full overflow-hidden">
                              <div className={`h-full ${table.customerPatience < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${table.customerPatience}%` }}></div>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-sm font-bold uppercase tracking-[0.3em]">空桌</div>
                  )}
              </div>

              {isOccupied && (
                  <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-full px-6 flex flex-col gap-2">
                      <div className="flex flex-wrap justify-center gap-2">
                          {table.orders.map((rid, i) => {
                              const recipe = recipes.find(r => r.id === rid);
                              let state: 'pending' | 'ready' | 'served' = 'pending';

                              if ((servedTracker[rid] || 0) > 0) {
                                  servedTracker[rid] -= 1;
                                  state = 'served';
                              } else if ((readyTracker[rid] || 0) > 0) {
                                  readyTracker[rid] -= 1;
                                  state = 'ready';
                              }

                              const bg = state === 'served' ? 'bg-green-100 border-green-300 text-green-800' : state === 'ready' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-stone-200 text-stone-800';

                              return (
                                  <button
                                      key={`${rid}_${i}`}
                                      disabled={state !== 'pending'}
                                      onClick={(e) => { e.stopPropagation(); if (state === 'pending') startOrder(table.id, rid); }}
                                      className={`px-3 py-2 rounded-xl shadow-md border text-sm font-bold min-w-[120px] transition ${bg} ${state === 'pending' ? 'hover:-translate-y-1' : 'opacity-70 cursor-not-allowed'}`}
                                  >
                                      <div className="flex items-center justify-between gap-2">
                                          <span className="truncate">{recipe?.name}</span>
                                          {state === 'ready' && <Clock size={12} className="text-blue-500 animate-bounce" />}
                                          {state === 'served' && <Check size={12} className="text-green-600" />}
                                      </div>
                                      <div className="text-[10px] uppercase tracking-wide font-mono">
                                          {state === 'pending' ? '制作' : state === 'ready' ? '待上桌' : '已送达'}
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              )}

              {isOccupied && tableOrders.length > 0 && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-3">
                      {tableOrders.map(renderDishToken)}
                  </div>
              )}
          </div>
      );
  };

  const renderKitchen = () => {
      const levelThreshold = LEVEL_THRESHOLDS[player.level];
      const nextLevelXp = levelThreshold || 999999;

      return (
          <div className="h-full w-full bg-gradient-to-b from-stone-900 to-stone-800 overflow-hidden relative">
              {/* HUD */}
              <div className="absolute top-0 left-0 right-0 h-20 z-50 pointer-events-none flex justify-between items-start p-4">
                  <div className="flex items-center gap-4 pointer-events-auto">
                      <div className="bg-stone-900/90 backdrop-blur text-yellow-400 px-4 py-2 rounded-xl border-2 border-stone-700 shadow-xl flex items-center gap-2 font-bold">
                          <Coins size={18} /> {player.gold}
                      </div>
                      <div className="bg-stone-900/90 backdrop-blur px-4 py-2 rounded-xl border-2 border-stone-700 shadow-xl flex flex-col w-40">
                          <div className="flex justify-between text-[10px] text-blue-300 font-bold uppercase mb-1">
                              <span>Chef Lv.{player.level}</span>
                              <span>{player.xp}/{nextLevelXp}</span>
                          </div>
                          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${Math.min(100, (player.xp / nextLevelXp) * 100)}%`}}></div>
                          </div>
                      </div>
                  </div>

                  <div className="pointer-events-auto">
                    {dayState.isActive ? (
                        <div className="bg-stone-900/90 text-white px-6 py-3 rounded-xl border-2 border-stone-700 shadow-xl flex items-center gap-3 text-2xl font-mono font-bold">
                            <Clock className={dayState.gameTime >= 1140 ? "text-red-500 animate-pulse" : "text-stone-400"} />
                            <span>{formatTime(dayState.gameTime)}</span>
                        </div>
                    ) : (
                        <button
                            onClick={startDay}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2 text-lg border-2 border-green-400"
                        >
                            <Play fill="currentColor" /> 开始营业 (10:00)
                        </button>
                    )}
                  </div>
              </div>

              <div className="absolute inset-0 pt-24 pb-12 px-6 overflow-auto">
                  <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-8 text-stone-200">
                          <div className="text-xs uppercase tracking-[0.3em] text-amber-300">Front View</div>
                          <h2 className="text-3xl font-black text-white mt-2">沙威玛传奇风格餐厅</h2>
                          <p className="text-sm text-stone-400 mt-2">拉近视角，桌上浮动菜单，直接取餐上桌。</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 place-items-center">
                          {tables.map((t) => renderTable(t))}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderMenu = () => {
      const visibleRecipes = recipes.filter(r => player.level >= r.unlockLevel || player.unlockedRecipes.includes(r.id));
      const filteredRecipes = menuCategory === 'ALL' ? visibleRecipes : visibleRecipes.filter(r => r.category === menuCategory);

      return (
          <div className="flex flex-col h-full bg-stone-100">
              <div className="bg-white shadow-md p-6 z-10 sticky top-0">
                  <h2 className="text-3xl font-bold mb-4 flex items-center gap-2 text-stone-800"><BookOpen className="text-amber-600"/> 菜单管理</h2>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {(['ALL', 'APPETIZER', 'MAIN', 'SOUP', 'DESSERT', 'DRINK'] as const).map(cat => (
                          <button
                              key={cat}
                              onClick={() => setMenuCategory(cat)}
                              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${menuCategory === cat ? 'bg-amber-600 text-white shadow-lg' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}
                          >
                              {cat === 'ALL' ? '全部' : CATEGORY_NAMES[cat]}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-stone-100">
                  <div className="grid gap-4 max-w-3xl mx-auto">
                      {filteredRecipes.map(recipe => {
                          const isUnlocked = player.unlockedRecipes.includes(recipe.id);
                          const isActive = player.activeMenu.includes(recipe.id);
                          const prepToolUnlocked = player.unlockedPrepMethods.includes(recipe.prepMethod);

                          return (
                              <div key={recipe.id} className={`group bg-white p-5 rounded-xl shadow-sm border-l-8 transition-all hover:shadow-md flex justify-between items-center relative overflow-hidden ${isActive ? 'border-green-500 ring-2 ring-green-100' : isUnlocked ? 'border-stone-300' : 'border-stone-200 bg-stone-50 opacity-80'}`}>
                                  <div className="flex-1 z-10 pr-4">
                                      <div className="flex items-center gap-3 mb-1">
                                          <h3 className={`font-bold text-xl text-stone-800`}>{recipe.name}</h3>
                                          <span className="text-[10px] px-2 py-0.5 bg-stone-200 rounded-full text-stone-600 font-bold uppercase tracking-wider">{CATEGORY_NAMES[recipe.category]}</span>
                                          {recipe.isAiGenerated && <Sparkles size={14} className="text-purple-500" />}
                                      </div>
                                      <p className="text-sm text-stone-500 mb-3 italic">{recipe.description}</p>
                                      
                                      <div className="flex flex-wrap gap-2 mb-3">
                                          {recipe.ingredients.map((ing, i) => (
                                              <span key={i} className="text-xs bg-stone-100 text-stone-700 border border-stone-200 px-2 py-1 rounded-full flex items-center gap-1">
                                                  {getIngredientEmoji(ing)} {ing}
                                              </span>
                                          ))}
                                      </div>

                                      <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
                                          <span className="flex items-center gap-1"><Coins size={12}/> {recipe.basePrice}</span>
                                          <span className="flex items-center gap-1"><Star size={12}/> {recipe.xpReward}</span>
                                          <span className={`flex items-center gap-1 ${!prepToolUnlocked ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                              {prepToolUnlocked ? <Check size={12}/> : <Lock size={12}/>} {PREP_NAMES[recipe.prepMethod]}
                                          </span>
                                      </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-2 min-w-[80px]">
                                    {isUnlocked ? (
                                        <button
                                            onClick={() => {
                                                setPlayer(prev => {
                                                    const newMenu = isActive 
                                                        ? prev.activeMenu.filter(id => id !== recipe.id)
                                                        : [...prev.activeMenu, recipe.id];
                                                    return { ...prev, activeMenu: newMenu };
                                                });
                                            }}
                                            className={`w-full py-2 rounded-lg font-bold text-sm shadow-sm transition-transform active:scale-95 ${isActive ? 'bg-white border-2 border-red-500 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-500'}`}
                                        >
                                            {isActive ? '下架' : '上架'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (player.skillPoints >= recipe.unlockCost) {
                                                    setPlayer(prev => ({
                                                        ...prev,
                                                        skillPoints: prev.skillPoints - recipe.unlockCost,
                                                        unlockedRecipes: [...prev.unlockedRecipes, recipe.id]
                                                    }));
                                                    showNotification(`解锁了 ${recipe.name}`, 'success');
                                                } else {
                                                    showNotification(`技能点不足 (需${recipe.unlockCost} SP)`, 'warn');
                                                }
                                            }}
                                            className="w-full py-2 rounded-lg font-bold text-sm bg-stone-800 text-white shadow hover:bg-stone-700 flex flex-col items-center justify-center group-hover:animate-pulse"
                                        >
                                            <span>解锁</span>
                                            <span className="text-[10px] text-yellow-400">{recipe.unlockCost} SP</span>
                                        </button>
                                    )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const renderShop = () => (
      <div className="flex flex-col h-full bg-stone-100">
          <div className="p-6 bg-white shadow-md z-10 flex justify-between items-center">
                <h2 className="text-3xl font-bold flex items-center gap-3 text-stone-800"><ShoppingBag className="text-green-600"/> 采购中心</h2>
                <div className="flex bg-stone-200 p-1 rounded-lg">
                    <button onClick={() => setShopTab('market')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${shopTab === 'market' ? 'bg-white shadow text-green-700' : 'text-stone-500 hover:text-stone-700'}`}>菜市场</button>
                    <button onClick={() => setShopTab('tools')} className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${shopTab === 'tools' ? 'bg-white shadow text-blue-700' : 'text-stone-500 hover:text-stone-700'}`}>厨具与扩建</button>
                </div>
          </div>
          <div className="flex-1 overflow-auto p-6 custom-scrollbar">
              {shopTab === 'market' ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                      {MARKET_ITEMS.map(item => (
                          <div key={item.name} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-stone-100 flex flex-col items-center relative group cursor-pointer"
                              onClick={() => {
                                  if (player.gold >= item.cost * 5) {
                                      setPlayer(p => ({...p, gold: p.gold - item.cost * 5, inventory: {...p.inventory, [item.name]: (p.inventory[item.name] || 0) + 5}}));
                                      showNotification(`购买了5个${item.name}`, 'success');
                                  } else showNotification("金币不足", 'warn');
                              }}
                          >
                              <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{item.emoji}</div>
                              <div className="font-bold text-stone-800">{item.name}</div>
                              <div className="text-xs text-stone-500 mb-3 font-mono bg-stone-100 px-2 py-1 rounded mt-1">库存: {player.inventory[item.name] || 0}</div>
                              <div className="w-full bg-green-50 text-green-700 py-1.5 rounded font-bold text-sm flex items-center justify-center gap-1 group-hover:bg-green-100">
                                  <Coins size={12}/> {item.cost * 5}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="max-w-4xl mx-auto space-y-8">
                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                           <h3 className="font-bold text-xl text-blue-900 mb-6 flex items-center gap-2 pb-2 border-b border-blue-100"><Zap size={20} className="text-blue-500"/> 研发新工具</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className={`p-6 rounded-xl border-2 flex items-center justify-between ${player.unlockedPrepMethods.includes(PrepMethod.WASH) ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                   <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-full shadow-sm text-blue-500"><Droplets size={24}/></div>
                                        <div>
                                            <div className="font-bold text-stone-800">水槽工作台</div>
                                            <div className="text-xs text-stone-500">解锁清洗类食谱 (沙拉/水果)</div>
                                        </div>
                                   </div>
                                   {player.unlockedPrepMethods.includes(PrepMethod.WASH) ? (
                                       <div className="text-green-600 font-bold flex items-center gap-1"><Check size={16}/> 已拥有</div>
                                   ) : (
                                       <button onClick={() => {
                                            if (player.skillPoints >= 1) {
                                                setPlayer(p => ({...p, skillPoints: p.skillPoints - 1, unlockedPrepMethods: [...p.unlockedPrepMethods, PrepMethod.WASH]}));
                                                showNotification("解锁了水槽！", 'success');
                                            } else showNotification("技能点不足", 'warn');
                                       }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-500">解锁 (1 SP)</button>
                                   )}
                               </div>

                               <div className={`p-6 rounded-xl border-2 flex items-center justify-between ${player.unlockedPrepMethods.includes(PrepMethod.MIX) ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'}`}>
                                   <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-full shadow-sm text-purple-500"><RotateCcw size={24}/></div>
                                        <div>
                                            <div className="font-bold text-stone-800">专业搅拌机</div>
                                            <div className="text-xs text-stone-500">解锁混合类食谱 (烘焙/蛋液)</div>
                                        </div>
                                   </div>
                                   {player.unlockedPrepMethods.includes(PrepMethod.MIX) ? (
                                       <div className="text-green-600 font-bold flex items-center gap-1"><Check size={16}/> 已拥有</div>
                                   ) : (
                                       <button onClick={() => {
                                            if (player.skillPoints >= 1) {
                                                setPlayer(p => ({...p, skillPoints: p.skillPoints - 1, unlockedPrepMethods: [...p.unlockedPrepMethods, PrepMethod.MIX]}));
                                                showNotification("解锁了搅拌机！", 'success');
                                            } else showNotification("技能点不足", 'warn');
                                       }} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-purple-500">解锁 (1 SP)</button>
                                   )}
                               </div>
                           </div>
                       </div>

                       <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
                            <h3 className="font-bold text-xl text-amber-900 mb-6 flex items-center gap-2 pb-2 border-b border-amber-100"><LayoutGrid size={20} className="text-amber-500"/> 厨房扩建</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-stone-800">扩展备菜区</div>
                                        <div className="text-xs text-stone-500 mt-1">当前容量: {player.maxPrepSlots}</div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (player.skillPoints >= 2) {
                                                setPlayer(p => ({...p, skillPoints: p.skillPoints - 2, maxPrepSlots: p.maxPrepSlots + 1}));
                                                showNotification("扩建成功!", 'success');
                                            } else showNotification("技能点不足 (需2点)", 'warn');
                                        }}
                                        className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-stone-700"
                                    >
                                        <ArrowUpCircle size={16}/> 升级 (2 SP)
                                    </button>
                                </div>
                                <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-stone-800">扩展烹饪区</div>
                                        <div className="text-xs text-stone-500 mt-1">当前容量: {player.maxCookSlots}</div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (player.skillPoints >= 2) {
                                                setPlayer(p => ({...p, skillPoints: p.skillPoints - 2, maxCookSlots: p.maxCookSlots + 1}));
                                                showNotification("扩建成功!", 'success');
                                            } else showNotification("技能点不足 (需2点)", 'warn');
                                        }}
                                        className="bg-stone-800 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-stone-700"
                                    >
                                        <ArrowUpCircle size={16}/> 升级 (2 SP)
                                    </button>
                                </div>
                            </div>
                       </div>

                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                          <h3 className="font-bold text-xl text-stone-800 mb-6 flex items-center gap-2 pb-2 border-b border-stone-100"><UtensilsCrossed size={20}/> 设备升级</h3>
                          <div className="grid gap-4">
                              {(Object.values(player.tools) as Tool[]).map(tool => (
                                  <div key={tool.id} className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-lg">{tool.name}</span>
                                              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Lv.{tool.level}</span>
                                          </div>
                                          <div className="text-sm text-stone-500 mt-1">{tool.description}</div>
                                          <div className="text-xs text-stone-400 mt-1">当前效率: {(tool.multiplier * 100).toFixed(0)}%</div>
                                      </div>
                                      <div className="flex gap-3">
                                          <button onClick={() => {
                                              const cost = Math.floor(tool.cost * 1.5);
                                              if (player.gold >= cost) {
                                                  setPlayer(p => ({
                                                      ...p, gold: p.gold - cost,
                                                      tools: {...p.tools, [tool.type]: {...tool, level: tool.level + 1, multiplier: tool.multiplier + 0.2, cost}}
                                                  }));
                                                  showNotification("升级成功", 'success');
                                              } else showNotification("金币不足", 'warn');
                                          }} className="bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-lg font-bold text-sm shadow">
                                              升级 ({Math.floor(tool.cost * 1.5)} G)
                                          </button>
                                          
                                          {!tool.isAutomated && tool.type === CookingMethod.CUT && (
                                              <button onClick={() => {
                                                  if (player.gold >= 500) {
                                                      setPlayer(p => ({
                                                          ...p, gold: p.gold - 500,
                                                          tools: {...p.tools, [tool.type]: {...tool, isAutomated: true, name: "自动切菜机"}}
                                                      }));
                                                      showNotification("购买了自动切菜机！", 'success');
                                                  } else showNotification("金币不足", 'warn');
                                              }} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-1">
                                                  <Zap size={14}/> 自动化 (500 G)
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );




  return (
    <div
        className="h-screen flex flex-col bg-stone-900 text-stone-800 font-sans select-none overflow-hidden"
    >
      {notification && <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-xl z-[100] text-white font-bold animate-bounce ${notification.type === 'warn' ? 'bg-red-500' : 'bg-blue-600'}`}>{notification.msg}</div>}

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'kitchen' && renderKitchen()}
        {activeTab === 'menu' && renderMenu()}
        {activeTab === 'shop' && renderShop()}
      </div>

      {/* Bottom Nav */}
      <div className="bg-stone-950 text-stone-500 border-t border-stone-900 p-2 pb-6 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
              {id: 'kitchen', icon: <UtensilsCrossed />, label: '厨房'},
              {id: 'menu', icon: <Menu />, label: '菜单'},
              {id: 'shop', icon: <ShoppingBag />, label: '采购'}
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => !dayState.isActive && setActiveTab(tab.id as any)} 
                className={`
                    flex flex-col items-center p-3 rounded-2xl transition-all duration-300
                    ${activeTab === tab.id ? 'bg-stone-800 text-yellow-500 translate-y-[-10px] shadow-lg border border-stone-700' : 'hover:bg-stone-900 hover:text-stone-300'}
                    ${dayState.isActive && tab.id !== 'kitchen' ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                `}
              >
                  {tab.icon} <span className="text-[10px] mt-1 font-bold uppercase tracking-wide">{tab.label}</span>
              </button>
          ))}
        </div>
      </div>
    </div>
  );
}
