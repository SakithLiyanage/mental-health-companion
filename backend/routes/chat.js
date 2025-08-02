const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Send a message to AI using OpenRouter API
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Chat endpoint called by user:', req.userId);
    const { message, mood } = req.body;

    if (!message) {
      console.log('Error: No message provided');
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('Saving user message:', message);
    // Save user message
    const userMessage = new ChatMessage({
      userId: req.userId,
      message: message.trim(),
      sender: 'user',
      ...(mood && { mood })
    });

    await userMessage.save();
    console.log('User message saved successfully');

    // Try OpenRouter API first, fallback to intelligent responses
    let aiResponseText;
    
    // List of free models to try (in order of preference)
    const freeModels = [
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free", 
      "microsoft/phi-3-mini-128k-instruct:free",
      "huggingface/microsoft/Phi-3-mini-4k-instruct:free"
    ];
    
    let modelUsed = null;
    
    // Try OpenRouter free models first
    for (const model of freeModels) {
      try {
        console.log(`Attempting OpenRouter API call with model: ${model}...`);
        console.log('API Key available:', process.env.OPENROUTER_API_KEY ? 'Yes' : 'No');
        
        const openRouterResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model,
            messages: [
              {
                role: "system",
                content: "You are Luna, a compassionate AI mental health companion. Provide empathetic, supportive, and helpful responses to users sharing their feelings and experiences. Keep responses concise (2-3 sentences), warm, and encouraging. Use emojis sparingly but meaningfully. Focus on validation, coping strategies, and gentle guidance."
              },
              {
                role: "user",
                content: message.trim()
              }
            ],
            max_tokens: 150,
            temperature: 0.7,
            top_p: 0.9
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://mental-health-companion-seven.vercel.app/',
              'X-Title': 'Mental Health Companion'
            },
            timeout: 15000
          }
        );

        console.log(`OpenRouter API response from ${model}:`, openRouterResponse.data);

        if (openRouterResponse.data?.choices?.[0]?.message?.content) {
          aiResponseText = openRouterResponse.data.choices[0].message.content.trim();
          modelUsed = model;
          console.log(`✅ Successfully got response from OpenRouter API using ${model}`);
          break; // Exit loop on success
        } else {
          throw new Error('Invalid response format from OpenRouter API');
        }
        
      } catch (modelError) {
        console.log(`❌ Model ${model} failed:`, modelError.response?.status, modelError.message);
        if (modelError.response?.data) {
          console.log(`${model} Error Details:`, modelError.response.data);
        }
        // Continue to next model
        continue;
      }
    }
    
    // If no model worked, use fallback
    if (!aiResponseText) {
    const lowerMessage = message.toLowerCase();
      
      // Analyze sentiment and keywords for more intelligent responses
      if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
        const anxietyResponses = [
          "I understand that you're feeling anxious. Anxiety can be really overwhelming, but you're taking a positive step by talking about it. Have you tried any breathing exercises? Sometimes taking slow, deep breaths can help calm our nervous system. 💙",
          "Anxiety is so challenging to deal with. You're brave for reaching out. One thing that helps many people is the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Would you like to try it? 🌿",
          "I hear that you're feeling anxious. That must be difficult. Remember that anxiety is temporary - it will pass. What's one small thing that usually brings you comfort? Sometimes focusing on small, positive actions can help us feel more grounded. ✨"
        ];
        aiResponseText = anxietyResponses[Math.floor(Math.random() * anxietyResponses.length)];
        
      } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || lowerMessage.includes('upset')) {
        const sadnessResponses = [
          "I'm sorry you're feeling this way. It's okay to feel sad - your emotions are valid and important. You don't have to carry this alone. Sometimes when we're feeling down, it helps to acknowledge that this feeling is temporary. What's one small thing that brought you even a tiny bit of joy recently? 🤗",
          "It sounds like you're going through a tough time. Sadness can feel so heavy, but you're showing strength by talking about it. Have you been able to take care of your basic needs today - eating, drinking water, getting some rest? Sometimes caring for our body helps our mind too. 💚",
          "I can sense that you're struggling right now. It's completely okay to have difficult days. You matter, and your feelings matter. Is there someone in your life you trust that you could reach out to? Or would you like to talk more about what's weighing on your heart? 🌙"
        ];
        aiResponseText = sadnessResponses[Math.floor(Math.random() * sadnessResponses.length)];
        
      } else if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('pressure') || lowerMessage.includes('too much')) {
        const stressResponses = [
          "Feeling overwhelmed is so difficult. It's like trying to juggle too many things at once. Remember, you don't have to handle everything perfectly or all at once. What feels most urgent right now? Sometimes breaking things down into smaller steps can help. 🌊",
          "Stress can be exhausting. You're doing the best you can with what you have right now, and that's enough. Have you had a chance to step away and take a few minutes for yourself today? Even 5 minutes of doing something calming can help reset our minds. 🍃",
          "I hear that you're feeling overwhelmed. That's such a challenging place to be. One thing that might help is asking yourself: 'What's the most important thing I need to focus on right now?' Let everything else wait for a moment. You've got this, one step at a time. 💪"
        ];
        aiResponseText = stressResponses[Math.floor(Math.random() * stressResponses.length)];
        
      } else if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad') || lowerMessage.includes('annoyed')) {
        const angerResponses = [
          "It sounds like you're feeling really frustrated or angry. Those are completely valid emotions - they're telling you that something important to you has been affected. Have you been able to express these feelings in a safe way? Sometimes physical activity or journaling can help process anger. 🔥",
          "Anger can be such an intense emotion. It's okay to feel this way. Behind anger, there's often hurt or frustration about something that matters to you. What do you think might be at the core of these feelings? I'm here to listen without judgment. ⚡",
          "I can sense your frustration. Anger is a normal human emotion, and you have every right to feel it. What would help you feel more at peace right now? Sometimes taking space to cool down or talking through what happened can be helpful. 🌋"
        ];
        aiResponseText = angerResponses[Math.floor(Math.random() * angerResponses.length)];
        
      } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('excited') || lowerMessage.includes('joy')) {
        const happyResponses = [
          "I'm so happy to hear that you're feeling good! It's wonderful when we can recognize and celebrate the positive moments. What's been going well for you? Sharing joy can make it even brighter. ✨",
          "That's fantastic! I love hearing when people are feeling positive. It's so important to acknowledge and savor these good moments. What's bringing you joy today? 🌟",
          "How wonderful! Your positive energy is contagious. It's beautiful to see you in a good place. These happy moments are precious - they remind us that difficult times are temporary and joy is always possible. 🌈"
        ];
        aiResponseText = happyResponses[Math.floor(Math.random() * happyResponses.length)];
        
      } else if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleep') || lowerMessage.includes('fatigue')) {
        const tiredResponses = [
          "It sounds like you're feeling really tired. Exhaustion can affect everything - our mood, our thoughts, our ability to cope. Have you been getting enough rest lately? Sometimes our bodies are telling us we need to slow down and recharge. 😴",
          "Being tired can make everything feel harder. Your body and mind might be asking for some rest and care. What would good self-care look like for you right now? Even small acts of kindness toward yourself can help. 🌙",
          "Fatigue can be so draining. Are you getting quality sleep, or is something keeping you from resting well? Sometimes when we're tired, it's our body's way of saying we need to prioritize our wellbeing. What would help you feel more rested? 💤"
        ];
        aiResponseText = tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
        
      } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated') || lowerMessage.includes('disconnected')) {
        const lonelyResponses = [
          "Loneliness can feel so heavy. I want you to know that even though you might feel alone, you're not truly alone - you matter, and there are people who care. Sometimes loneliness is our heart's way of telling us we need connection. Is there someone you could reach out to today? 🤗",
          "Feeling isolated is really difficult. Human connection is so important for our wellbeing. Even small connections can help - a text to a friend, a smile to a stranger, or even talking here with me. You're taking a step toward connection right now by sharing this. 💙",
          "I hear that you're feeling lonely. That's such a painful feeling, but you're not alone in experiencing it. Many people feel this way sometimes. What kinds of connections usually help you feel less isolated? Sometimes even small social interactions can help us feel more connected to the world. �"
        ];
        aiResponseText = lonelyResponses[Math.floor(Math.random() * lonelyResponses.length)];
        
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        const greetingResponses = [
          "Hello! I'm so glad you're here. I'm Luna, and I'm here to listen and support you. How are you feeling today? Whatever you're going through, you don't have to face it alone. 🌙",
          "Hi there! Welcome. It's brave of you to reach out. I'm here to provide a safe space where you can share whatever is on your mind. What would you like to talk about today? ✨",
          "Hey! I'm happy you decided to connect. Sometimes just having someone to talk to can make a difference. How has your day been treating you? I'm here to listen with empathy and without judgment. 💙"
        ];
        aiResponseText = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        
      } else {
        // General supportive responses for anything else
        const generalResponses = [
          "Thank you for sharing that with me. Your thoughts and feelings are important. I'm here to listen and support you through whatever you're experiencing. What would be most helpful for you right now? 🌟",
          "I appreciate you opening up about this. It takes courage to express what we're going through. How are you taking care of yourself today? Remember that small acts of self-care can make a big difference. 🌿",
          "I hear you, and I want you to know that your feelings are completely valid. You're not alone in whatever you're facing. What's one thing that usually helps you feel a little better when things are tough? 💚",
          "Thank you for trusting me with your thoughts. Mental health is so important, and I'm glad you're taking time to check in with yourself. What's been on your mind lately? I'm here to listen. 🤗",
          "I'm here for you. Sometimes just talking about what we're experiencing can help us process it better. What would you like to explore or talk about today? Your wellbeing matters. ✨"
        ];
        aiResponseText = generalResponses[Math.floor(Math.random() * generalResponses.length)];
      }
    }

    console.log('AI response text:', aiResponseText);
    // Save AI response
    const aiMessage = new ChatMessage({
      userId: req.userId,
      message: aiResponseText,
      sender: 'ai'
    });

    await aiMessage.save();
    console.log('AI message saved successfully');

    res.json({
      userMessage,
      aiMessage
    });

  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error processing chat message' });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const messages = await ChatMessage.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ messages });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error fetching chat history' });
  }
});

module.exports = router;
