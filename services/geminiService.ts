import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateShoppingAdvice = async (
  query: string,
  products: Product[],
  history: string[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "عذراً، لا يمكنني العمل بدون مفتاح API.";
  }

  try {
    const productCatalog = products.map(p => `${p.name} (${p.price} ريال): ${p.description}`).join('\n');
    
    // Arabic System Prompt
    const prompt = `
      السياق: المستخدم يسأل عن منتجات في متجر إلكتروني يسمى "متجر الخلية" (Hive Store).
      
      قائمة المنتجات المتاحة:
      ${productCatalog}

      سجل المحادثة:
      ${history.join('\n')}

      سؤال المستخدم: ${query}

      التعليمات:
      أنت مساعد ذكي ومبيعات لمتجر الخلية.
      تحدث باللغة العربية فقط.
      رشح منتجات من القائمة أعلاه بناءً على طلب المستخدم.
      اجعل إجاباتك مختصرة (أقل من 100 كلمة) وودودة ومشجعة على الشراء.
      إذا سأل المستخدم عن شيء غير موجود، اعتذر بأدب واقترح العسل أو المعدات المتاحة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "أفكر في إجابة مناسبة... لحظة من فضلك.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة لاحقاً.";
  }
};