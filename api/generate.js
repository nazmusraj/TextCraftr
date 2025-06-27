// Import the fetch function
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(request, response) {
    // 1. Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Only POST requests are allowed' });
    }

    // 2. Get the API key securely from Vercel's environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ message: 'API key not configured' });
    }

    // 3. Get the user's prompt from the request body
    const { prompt } = request.body;
    if (!prompt) {
        return response.status(400).json({ message: 'Prompt is required' });
    }

    // 4. Set up the call to the actual Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }]
    };

    try {
        // 5. Make the secure, server-to-server API call
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error('Gemini API Error:', errorData);
            throw new Error(`Gemini API request failed with status ${geminiResponse.status}`);
        }

        const result = await geminiResponse.json();
        
        // 6. Extract the text and send it back to the frontend
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return response.status(200).json({ text });

    } catch (error) {
        console.error('Error in API handler:', error.message);
        return response.status(500).json({ message: 'An internal server error occurred.' });
    }
}
