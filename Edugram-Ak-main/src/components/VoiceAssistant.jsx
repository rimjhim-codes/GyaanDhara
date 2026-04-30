import React, { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, X, Send, Volume2 } from 'lucide-react';
import { generateContent } from '../services/llmService';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your AI assistant. Ask me anything about the topic you\'re learning, or ask for help navigating the platform.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal) {
          setInputValue(transcript);
          handleSendMessage(null, transcript);
        }
      };
    }
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setInputValue('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (e, textToSend = null) => {
    if (e) e.preventDefault();
    
    const messageText = textToSend || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage = { type: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate response using LLM
      const systemPrompt = `You are a helpful AI tutor assistant. Keep responses concise (2-3 sentences). 
If the user asks about a topic they're learning, provide a brief explanation. 
If they ask about navigation, help them understand how to use the platform.
Be friendly and encouraging.`;

      const prompt = `${systemPrompt}\n\nUser: ${messageText}\n\nAssistant:`;
      
      // For simplicity, use generateContent function
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:1.5b',
          prompt: prompt,
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botReply = data.response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        
        const botMessage = { type: 'bot', text: botReply };
        setMessages((prev) => [...prev, botMessage]);
        
        // Speak the response
        speakText(botReply);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage = { type: 'bot', text: 'Sorry, I couldn\'t process that. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
          zIndex: 999,
          transition: 'transform 0.3s, box-shadow 0.3s',
          fontSize: '28px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(124, 58, 237, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.4)';
        }}
        title="AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '5rem',
            right: '2rem',
            width: '400px',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 998,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>AI Assistant</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ask anything • Get instant help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'slideIn 0.3s ease-out',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: msg.type === 'user' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          animation: 'bounce 1.4s infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              className="input-field"
              placeholder="Type or click mic to speak..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              disabled={isLoading || isListening}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '0.9rem',
              }}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                padding: '0.75rem',
                background: isListening ? 'var(--color-accent)' : 'rgba(124, 58, 237, 0.3)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <Mic size={18} />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '0.75rem',
                background: 'var(--color-primary)',
                border: 'none',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bounce {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default VoiceAssistant;
