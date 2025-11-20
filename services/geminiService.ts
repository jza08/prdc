
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, CookingMethod, PrepMethod, RecipeCategory } from '../types';

// Initialize Gemini AI Client
// Note: process.env.API_KEY is injected by the runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAiRecipe = async (ingredients: string[], currentLevel: number): Promise<Recipe | null> => {
  try {
    const prompt = `
      使用以下食材创作一道独特且富有创意的菜肴：${ingredients.join(', ')}。
      玩家当前等级为 ${currentLevel}。
      从以下烹饪方法中选择一种：CUT (切菜), FRY (煎炒), STEW (炖煮), BAKE (烘烤)。
      从以下准备方法中选择一种：CHOP (切配), WASH (清洗), MIX (搅拌)。
      从以下类别中选择一种：APPETIZER (前菜), MAIN (主菜), SOUP (汤品), DESSERT (甜点), DRINK (饮品)。
      
      请返回一个符合schema的JSON对象。
      
      要求：
      1. "name" (菜名) 和 "description" (描述) 必须使用中文。
      2. 菜名要朗朗上口，描述要让人垂涎欲滴。
      3. 难度 (difficulty) 在 1 到 5 之间。
      4. 价格 (basePrice) 和 经验值 (xpReward) 应根据等级 ${currentLevel} 进行平衡（例如：1级约20金币，5级约100金币）。
      5. 严格遵守Schema中的Enum类型。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            method: { type: Type.STRING, enum: ["CUT", "FRY", "STEW", "BAKE"] },
            prepMethod: { type: Type.STRING, enum: ["CHOP", "WASH", "MIX"] },
            category: { type: Type.STRING, enum: ["APPETIZER", "MAIN", "SOUP", "DESSERT", "DRINK"] },
            basePrice: { type: Type.INTEGER },
            xpReward: { type: Type.INTEGER },
            difficulty: { type: Type.INTEGER },
          },
          required: ["name", "description", "method", "prepMethod", "category", "basePrice", "xpReward", "difficulty"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    if (!data.name) return null;

    return {
      id: `ai_${Date.now()}`,
      name: data.name,
      description: data.description,
      method: data.method as CookingMethod,
      prepMethod: data.prepMethod as PrepMethod,
      category: data.category as RecipeCategory,
      basePrice: data.basePrice,
      xpReward: data.xpReward,
      difficulty: Math.max(1, Math.min(5, data.difficulty)),
      ingredients: ingredients,
      unlockLevel: currentLevel,
      unlockCost: 0, // AI recipes are unlocked by default (paid via research)
      isAiGenerated: true
    };

  } catch (error) {
    console.error("Failed to generate recipe:", error);
    return null;
  }
};
