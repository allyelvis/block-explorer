import { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';

// Per instructions, API key must be from process.env.API_KEY.
// The execution environment is expected to provide this.
const API_KEY = process.env.API_KEY;

export const useGemini = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Check for API key availability.
    const isConfigured = !!API_KEY;

    const explainTransaction = useCallback(async (tx: any): Promise<string | null> => {
        if (!isConfigured) {
            const errorMessage = "Gemini API key not configured.";
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const prompt = `You are an expert Ethereum blockchain analyst.
Explain the following transaction in simple, easy-to-understand terms for a non-technical user.
- What is the type of this transaction? (e.g., Simple ETH transfer, Contract Deployment, NFT mint, Token Swap, etc.)
- Who is the sender and who is the receiver?
- What is the value and what does it represent?
- Is there any other important information in the data payload?

Keep the explanation concise and clear. Format the output as clean markdown.

Transaction Data:
\`\`\`json
${JSON.stringify({
    to: tx.to,
    from: tx.from,
    value: tx.value ? tx.value.toString() : '0',
    data: tx.data && tx.data.length > 2 ? tx.data.slice(0, 100) + '...' : '0x', // Truncate data for brevity
    gasLimit: tx.gasLimit ? tx.gasLimit.toString() : 'N/A',
    gasPrice: tx.gasPrice ? tx.gasPrice.toString() : 'N/A',
}, null, 2)}
\`\`\`
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-04-17',
                contents: prompt,
            });

            return response.text;

        } catch (e: any) {
            console.error("Gemini API call failed:", e);
            const errorMessage = "Failed to get explanation from AI. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isConfigured]);

    return { isLoading, error, explainTransaction, isConfigured };
};
