const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Gemini AI
const geminiApiKey = "AIzaSyCrHol9BNFf-SMuEGbu7IOLyGgN06QbANY";
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Store chat sessions
const chatSessions = new Map();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create chat session
        let chat;
        if (!chatSessions.has(sessionId)) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            chat = model.startChat({
                generationConfig: {
                    temperature: 0.7,
                },
            });
            chatSessions.set(sessionId, chat);
        } else {
            chat = chatSessions.get(sessionId);
        }

        // Send message to Gemini
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ 
            response: text,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ 
            error: 'Failed to get response from AI',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Voice Assistant server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
});

// Clean up old chat sessions periodically
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [sessionId, chat] of chatSessions.entries()) {
        // For now, we'll just keep all sessions
        // In a production app, you'd track session creation time
    }
}, 5 * 60 * 1000); // Check every 5 minutes 