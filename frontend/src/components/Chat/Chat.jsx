import React, { useState, useEffect, useRef } from 'react';
import { useGoal } from '../../contexts/GoalContext.jsx';

// Mental Health Chat Component
const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { markChatCompleted } = useGoal();
  
  const chatSuggestions = [
    { text: "I'm feeling anxious today", emoji: "😰", category: "anxiety" },
    { text: "Can you help me relax?", emoji: "😌", category: "relaxation" },
    { text: "I had a great day!", emoji: "😊", category: "positive" },
    { text: "I'm struggling with sleep", emoji: "😴", category: "sleep" },
    { text: "I need motivation", emoji: "💪", category: "motivation" },
    { text: "I feel overwhelmed", emoji: "🌊", category: "stress" },
  ];

  // Load chat history or show welcome message
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading chat history, token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('https://mental-health-companion-backend-eight.vercel.app/api/chat/history?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Chat history response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Chat history data:', data);
        
        if (data.messages && data.messages.length > 0) {
          // Convert backend messages to frontend format
          const formattedMessages = data.messages.reverse().map(msg => ({
            id: msg._id,
            text: msg.message,
            sender: msg.sender,
            timestamp: new Date(msg.createdAt),
            mood: msg.mood
          }));
          setMessages(formattedMessages);
        } else {
          // Show welcome message if no history
          const welcomeMessage = {
            id: '1',
            text: "Hello! I'm Luna, your AI companion. I'm here to listen and support you through whatever you're feeling. How are you doing today? 🌙",
            sender: 'ai',
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // Show welcome message if API call fails
        const welcomeMessage = {
          id: '1',
          text: "Hello! I'm Luna, your AI companion. I'm here to listen and support you through whatever you're feeling. How are you doing today? 🌙",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show welcome message on error
      const welcomeMessage = {
        id: '1',
        text: "Hello! I'm Luna, your AI companion. I'm here to listen and support you through whatever you're feeling. How are you doing today? 🌙",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Call the backend chat API
      const token = localStorage.getItem('token');
      console.log('Sending message to backend:', messageText);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('https://mental-health-companion-backend-eight.vercel.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      console.log('Chat API response:', data);
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: data.aiMessage.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Mark chat as completed for daily goal
      markChatCompleted();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to a default error response
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. I'm here when you're ready to talk. 💙",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-calm-50 via-white to-primary-50">
      
      {/* Header */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-calm-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌙</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white">
                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5 animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-calm-900">Luna AI</h1>
              <p className="text-sm text-calm-600 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Always here for you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-calm-300 scrollbar-track-calm-100 hover:scrollbar-thumb-calm-400">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md'
                  : 'bg-white text-calm-900 rounded-bl-md border border-calm-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && (
                  <span className="text-lg mt-0.5">🌙</span>
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      message.sender === 'user' ? 'text-primary-100' : 'text-calm-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.mood && message.sender === 'user' && (
                      <span className="text-sm">{message.mood}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-calm-900 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-calm-200">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌙</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-calm-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-calm-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-calm-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-calm-500">Luna is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length <= 1 && (
        <div className="flex-shrink-0 px-6 py-4 border-t border-calm-200 bg-white/50">
          <h3 className="text-sm font-semibold text-calm-700 mb-3">Need help getting started?</h3>
          <div className="grid grid-cols-2 gap-2">
            {chatSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => sendMessage(suggestion.text)}
                className="flex items-center p-3 bg-white/80 hover:bg-white border border-calm-200 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 text-left"
              >
                <span className="text-lg mr-3">{suggestion.emoji}</span>
                <span className="text-sm text-calm-700">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-calm-200 px-6 py-4">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="w-full px-4 py-3 bg-calm-50 border border-calm-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32 transition-all duration-200"
              rows={1}
              disabled={isLoading}
            />
            {inputMessage && (
              <div className="absolute right-3 top-3">
                <span className="text-xs text-calm-500">
                  {inputMessage.length}/500
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 rounded-2xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-105"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-calm-500">
          <div className="flex items-center space-x-4">
            <span>💙 Compassionate AI</span>
            <span>🔒 Private & Secure</span>
            <span>🌙 Always Available</span>
          </div>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
