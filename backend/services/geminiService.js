import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const enrichEventWithAI = async (title, description) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
        Read the following event description and return strict JSON with:
        - "summary": a concise 2-sentence summary
        - "tags": an array of exactly 3 specific, lowercase topic tags

        Title: ${title}
        Description: ${description}

        Return only valid JSON, no additional text.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        const enrichedData = JSON.parse(responseText);

        logger.logInfo(`Event enriched with AI: ${title}`);
        return enrichedData;
    } catch (error) {
        logger.logError(`Gemini API error: ${error.message}`);
        throw new Error('Failed to enrich event with AI');
    }
};
