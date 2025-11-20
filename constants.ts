
import { CookingMethod, PrepMethod, Recipe, MarketItem } from './types';

export const MARKET_ITEMS: MarketItem[] = [
  { name: '番茄', cost: 5, emoji: '🍅' },
  { name: '罗勒', cost: 2, emoji: '🌿' },
  { name: '橄榄油', cost: 4, emoji: '🫒' },
  { name: '鸡蛋', cost: 3, emoji: '🥚' },
  { name: '盐', cost: 1, emoji: '🧂' },
  { name: '黑胡椒', cost: 2, emoji: '⚫' },
  { name: '胡萝卜', cost: 3, emoji: '🥕' },
  { name: '土豆', cost: 3, emoji: '🥔' },
  { name: '西兰花', cost: 4, emoji: '🥦' },
  { name: '牛肉', cost: 30, emoji: '🥩' },
  { name: '大蒜', cost: 2, emoji: '🧄' },
  { name: '黄油', cost: 5, emoji: '🧈' },
  { name: '面粉', cost: 3, emoji: '🌾' },
  { name: '奶油', cost: 6, emoji: '🥛' },
  { name: '水果', cost: 8, emoji: '🍎' },
  { name: '鳕鱼', cost: 25, emoji: '🐟' },
  { name: '虾', cost: 20, emoji: '🦐' },
  { name: '番茄酱', cost: 5, emoji: '🥫' },
  { name: '猪肉', cost: 15, emoji: '🍖' },
  { name: '鸡肉', cost: 12, emoji: '🍗' },
  { name: '洋葱', cost: 2, emoji: '🧅' },
  { name: '米饭', cost: 2, emoji: '🍚' },
  { name: '辣椒', cost: 3, emoji: '🌶️' },
  { name: '糖', cost: 2, emoji: '🍬' },
  { name: '牛奶', cost: 4, emoji: '🥛' },
  { name: '芝士', cost: 10, emoji: '🧀' },
  { name: '面包', cost: 4, emoji: '🍞' },
  { name: '咖啡豆', cost: 15, emoji: '☕' },
  { name: '柠檬', cost: 4, emoji: '🍋' },
  { name: '蘑菇', cost: 5, emoji: '🍄' },
  { name: '冰块', cost: 1, emoji: '🧊' },
];

export const INITIAL_RECIPES: Recipe[] = [
  // --- STARTING RECIPES (Level 1, Cost 0) ---
  {
    id: 'tomato_salad',
    name: '简易番茄沙拉',
    description: '新鲜的番茄切片配罗勒叶。',
    category: 'APPETIZER',
    basePrice: 20,
    xpReward: 10,
    unlockLevel: 1,
    unlockCost: 0,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.CUT,
    difficulty: 1,
    ingredients: ['番茄', '罗勒', '橄榄油']
  },
  {
    id: 'fried_egg',
    name: '完美煎蛋',
    description: '单面煎蛋，蛋黄鲜嫩流动。',
    category: 'MAIN', // Moved to Main for starter balance
    basePrice: 25,
    xpReward: 15,
    unlockLevel: 1,
    unlockCost: 0, // Free starter
    prepMethod: PrepMethod.MIX,
    method: CookingMethod.FRY,
    difficulty: 1,
    ingredients: ['鸡蛋', '盐', '黑胡椒']
  },
  {
    id: 'mushroom_soup',
    name: '奶油蘑菇汤',
    description: '浓郁的菌菇香气。',
    category: 'SOUP',
    basePrice: 30,
    xpReward: 20,
    unlockLevel: 1,
    unlockCost: 0, // Free starter
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.STEW,
    difficulty: 1,
    ingredients: ['蘑菇', '奶油', '洋葱']
  },
  {
    id: 'orange_juice',
    name: '鲜榨橙汁',
    description: '补充维生素C的最佳选择。',
    category: 'DRINK',
    basePrice: 15,
    xpReward: 10,
    unlockLevel: 1,
    unlockCost: 0, // Free starter
    prepMethod: PrepMethod.CHOP, // Slicing oranges
    method: CookingMethod.CUT,
    difficulty: 1,
    ingredients: ['水果', '糖', '冰块']
  },
  {
    id: 'pudding',
    name: '焦糖布丁',
    description: '入口即化的甜蜜享受。',
    category: 'DESSERT',
    basePrice: 25,
    xpReward: 15,
    unlockLevel: 1,
    unlockCost: 0, // Free starter
    prepMethod: PrepMethod.MIX,
    method: CookingMethod.BAKE, // Or Cut/Fridge logic, simpler to use Bake
    difficulty: 1,
    ingredients: ['牛奶', '鸡蛋', '糖']
  },

  // --- UNLOCKABLE RECIPES ---
  
  // APPETIZERS
  {
    id: 'bruschetta',
    name: '意式烤面包',
    description: '蒜香面包配番茄丁。',
    category: 'APPETIZER',
    basePrice: 35,
    xpReward: 25,
    unlockLevel: 2,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.BAKE,
    difficulty: 2,
    ingredients: ['面包', '番茄', '大蒜']
  },
  {
    id: 'onion_rings',
    name: '炸洋葱圈',
    description: '金黄酥脆的开胃菜。',
    category: 'APPETIZER',
    basePrice: 30,
    xpReward: 20,
    unlockLevel: 3,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.FRY,
    difficulty: 2,
    ingredients: ['洋葱', '面粉', '油']
  },

  // MAINS
  {
    id: 'steak',
    name: '香煎肋眼牛排',
    description: '外焦里嫩，完美锁住肉汁。',
    category: 'MAIN',
    basePrice: 80,
    xpReward: 60,
    unlockLevel: 3,
    unlockCost: 2,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.FRY,
    difficulty: 4,
    ingredients: ['牛肉', '大蒜', '黄油']
  },
  {
    id: 'cheese_pasta',
    name: '芝士肉酱面',
    description: '经典的意式风味。',
    category: 'MAIN',
    basePrice: 55,
    xpReward: 40,
    unlockLevel: 2,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.STEW,
    difficulty: 3,
    ingredients: ['猪肉', '番茄酱', '芝士', '面粉'] // Simplified pasta as flour
  },
  {
    id: 'fish_chips',
    name: '炸鱼薯条',
    description: '英伦风味。',
    category: 'MAIN',
    basePrice: 60,
    xpReward: 45,
    unlockLevel: 4,
    unlockCost: 2,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.FRY,
    difficulty: 3,
    ingredients: ['鳕鱼', '土豆', '面粉']
  },
  {
    id: 'roast_chicken',
    name: '迷迭香烤鸡',
    description: '整只鸡烘烤至金黄。',
    category: 'MAIN',
    basePrice: 70,
    xpReward: 55,
    unlockLevel: 5,
    unlockCost: 2,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.BAKE,
    difficulty: 4,
    ingredients: ['鸡肉', '罗勒', '盐', '黄油']
  },

  // SOUPS
  {
    id: 'veg_soup',
    name: '田园蔬菜汤',
    description: '温暖人心的什锦蔬菜汤。',
    category: 'SOUP',
    basePrice: 40,
    xpReward: 35,
    unlockLevel: 2,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.STEW,
    difficulty: 2,
    ingredients: ['胡萝卜', '土豆', '西兰花']
  },
  {
    id: 'fish_stew',
    name: '浓郁海鲜烩',
    description: '汇集海洋精华的浓汤。',
    category: 'MAIN', // Can be main or soup
    basePrice: 120,
    xpReward: 100,
    unlockLevel: 6,
    unlockCost: 3,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.STEW,
    difficulty: 5,
    ingredients: ['鳕鱼', '虾', '番茄酱']
  },
  {
    id: 'borscht',
    name: '罗宋汤',
    description: '酸甜开胃的红菜汤。',
    category: 'SOUP',
    basePrice: 45,
    xpReward: 30,
    unlockLevel: 3,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.STEW,
    difficulty: 3,
    ingredients: ['牛肉', '番茄', '胡萝卜']
  },

  // DESSERTS
  {
    id: 'fruit_tart',
    name: '鲜果果塔',
    description: '酥脆塔皮搭配时令水果。',
    category: 'DESSERT',
    basePrice: 60,
    xpReward: 50,
    unlockLevel: 3,
    unlockCost: 2,
    prepMethod: PrepMethod.WASH,
    method: CookingMethod.BAKE,
    difficulty: 3,
    ingredients: ['面粉', '奶油', '水果']
  },
  {
    id: 'brownie',
    name: '巧克力布朗尼',
    description: '浓郁厚实的巧克力蛋糕。',
    category: 'DESSERT',
    basePrice: 50,
    xpReward: 40,
    unlockLevel: 4,
    unlockCost: 2,
    prepMethod: PrepMethod.MIX,
    method: CookingMethod.BAKE,
    difficulty: 2,
    ingredients: ['面粉', '糖', '奶油', '鸡蛋'] // Simulating chocolate with cream? Added cocoa implies complexity, keep simple
  },

  // DRINKS
  {
    id: 'lemonade',
    name: '冰镇柠檬水',
    description: '夏日解暑神器。',
    category: 'DRINK',
    basePrice: 18,
    xpReward: 12,
    unlockLevel: 2,
    unlockCost: 1,
    prepMethod: PrepMethod.CHOP,
    method: CookingMethod.CUT,
    difficulty: 1,
    ingredients: ['柠檬', '糖', '冰块']
  },
  {
    id: 'coffee',
    name: '现磨咖啡',
    description: '提神醒脑。',
    category: 'DRINK',
    basePrice: 25,
    xpReward: 15,
    unlockLevel: 3,
    unlockCost: 1,
    prepMethod: PrepMethod.MIX, // Grinding
    method: CookingMethod.STEW, // Brewing
    difficulty: 2,
    ingredients: ['咖啡豆', '牛奶', '糖']
  }
];

export const LEVEL_THRESHOLDS = [0, 150, 450, 900, 1500, 2200, 3000, 4000, 5500, 7500];
