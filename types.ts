
export enum CookingMethod {
  CUT = 'CUT', // Kept for legacy/compatibility, represents cold dish finishing
  FRY = 'FRY',
  STEW = 'STEW',
  BAKE = 'BAKE'
}

export enum PrepMethod {
  CHOP = 'CHOP',
  WASH = 'WASH',
  MIX = 'MIX'
}

export type RecipeCategory = 'APPETIZER' | 'MAIN' | 'SOUP' | 'DESSERT' | 'DRINK';

export interface Ingredient {
  name: string;
  color: string;
}

export interface MarketItem {
  name: string;
  cost: number;
  emoji: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;
  basePrice: number;
  xpReward: number;
  unlockLevel: number;
  unlockCost: number;
  prepMethod: PrepMethod;
  method: CookingMethod;
  difficulty: number;
  ingredients: string[];
}

export interface PlayerState {
  gold: number;
  xp: number;
  level: number;
  unlockedRecipes: string[];
  activeMenu: string[];
  inventory: Record<string, number>;
}

export enum OrderStatus {
  WAITING = 'WAITING',
  PREPPING = 'PREPPING',
  COOKING = 'COOKING',
  READY = 'READY',
  SERVED = 'SERVED',
  BURNT = 'BURNT'
}

export interface Order {
  id: string;
  tableId: number; // Link to a table
  recipeId: string;
  status: OrderStatus;
  progress: number;
  stationId?: number;
}

export interface Table {
  id: number;
  isOccupied: boolean;
  customerPatience: number; // 0-100, shared for the table
  maxPatience: number;
  orders: string[]; // Array of Recipe IDs required
  servedOrders: string[]; // Array of Recipe IDs already delivered
  totalBill: number;
}

export interface DayState {
  isActive: boolean;
  gameTime: number; // Minutes from midnight (e.g., 600 = 10:00 AM)
  earnings: number;
  customersServed: number;
}
