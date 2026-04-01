import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function SupportChat() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hi! I already have a feeling it's been a long day. I'm MindCheck—I'm here to listen, understand, and most importantly, I've got your back. How can I support you right now?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const scrollRef = useRef(null);

  // Fetch Location on Mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.city && data.country_name) {
          const locString = `${data.city}, ${data.country_name}`;
          setUserLocation(locString);
          console.log("📍 Location detected:", locString);
        }
      } catch (err) {
        console.warn("Could not fetch location:", err);
      }
    };
    fetchLocation();
  }, []);

  // Fetch History on Open
  useEffect(() => {
    if (isOpen && currentUser) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat-history/?user_uid=${currentUser.uid}`);
          if (res.data && res.data.length > 0) {
            setMessages(res.data);
          }
        } catch (err) {
          console.error("Chat history fetch failed:", err);
        }
      };
      fetchHistory();
    }
  }, [isOpen, currentUser]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setIsTyping(true);

    try {
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat-stream/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_uid: currentUser?.uid || 'anonymous',
          message: userMsg,
          location: userLocation // Pass location to backend
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = aiContent;
          return newMessages;
        });
      }
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', content: "I'm having a bit of trouble connecting right now, but I'm still here for you. Could you try your message once more?" }
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (!currentUser || !window.confirm("Start a fresh conversation? This will clear our history.")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/clear-chat/?user_uid=${currentUser.uid}`);
      setMessages([{ role: 'model', content: "Fresh start! What's on your mind now?" }]);
    } catch (err) {
      console.error("Clear failed:", err);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-fab"
          style={{
            position: 'fixed', bottom: 40, right: 40,
            width: 70, height: 70, borderRadius: '24px',
            background: 'linear-gradient(135deg, #a7bfff, #ffaecd)',
            color: '#fff', border: 'none',
            boxShadow: '0 12px 40px rgba(167, 191, 255, 0.5)',
            cursor: 'pointer', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <span style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))' }}>💭</span>
        </button>
      )}

      {isOpen && (
        <div className="chat-window" style={{
          position: 'fixed', bottom: 40, right: 40,
          width: 420, height: 600,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: 40,
          boxShadow: '0 30px 60px rgba(0,0,0,0.12)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'premiumScaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '30px 25px',
            background: 'rgba(255,255,255,0.3)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 50, height: 50, borderRadius: '18px',
                background: 'linear-gradient(135deg, #a7bfff, #ffaecd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, boxShadow: '0 8px 20px rgba(167, 191, 255, 0.3)'
              }}>🌸</div>
              <div>
                <div style={{ fontWeight: 800, color: '#1a1a1a', fontSize: 18, letterSpacing: '-0.5px' }}>MindCheck</div>
                <div style={{ fontSize: 13, color: '#00d084', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d084', display: 'inline-block' }}></span>
                  {userLocation ? `Online from ${userLocation.split(',')[0]}` : 'Always here for you'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleClear}
                title="Clear Conversation"
                style={{
                  background: 'rgba(0,0,0,0.03)', borderRadius: '50%', width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                  color: '#666', fontSize: 14, cursor: 'pointer', transition: '0.3s'
                }}
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(0,0,0,0.03)', borderRadius: '50%', width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                  color: '#666', fontSize: 16, cursor: 'pointer', transition: '0.3s'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                animation: 'messageSlideUp 0.4s ease-out'
              }}>
                <div style={{
                  background: m.role === 'user' ? 'linear-gradient(135deg, #a7bfff, #ffaecd)' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#2d3436',
                  padding: '16px 20px', borderRadius: '24px',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 24,
                  borderBottomLeftRadius: m.role === 'model' ? 4 : 24,
                  fontSize: 15, lineHeight: 1.6,
                  boxShadow: m.role === 'user' ? '0 8px 25px rgba(167, 191, 255, 0.4)' : '0 10px 30px rgba(0,0,0,0.03)',
                  border: m.role === 'model' ? '1px solid rgba(0,0,0,0.02)' : 'none'
                }}>
                  <div className="markdown-content">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '15px 20px', background: '#fff', borderRadius: '20px', borderBottomLeftRadius: 4, display: 'flex', gap: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <div className="typing-dot"></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>

          <div style={{ padding: '30px 25px', background: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: 15, background: '#fff', padding: '8px', borderRadius: '24px', boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.03)' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Share what's on your mind..."
                style={{ flex: 1, padding: '12px 20px', borderRadius: '20px', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, color: '#1a1a1a' }}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  width: 50, height: 50, borderRadius: '18px',
                  background: loading ? '#dfe6e9' : 'linear-gradient(135deg, #a7bfff, #ffaecd)',
                  color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s',
                  boxShadow: loading ? 'none' : '0 8px 20px rgba(167, 191, 255, 0.4)'
                }}
              >
                <span style={{ fontSize: 20 }}>➤</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .chat-fab:hover { transform: scale(1.1) rotate(-5deg); box-shadow: 0 15px 45px rgba(167, 191, 255, 0.7); }
        .close-btn:hover { background: rgba(255,0,0,0.05) !important; color: #ff5e57 !important; transform: rotate(90deg); }
        
        .markdown-content p { margin: 0; }
        .markdown-content ul, .markdown-content ol { padding-left: 20px; margin: 8px 0 0 0; }
        .markdown-content li { margin-bottom: 4px; }
        
        .typing-dot { width: 8px; height: 8px; background: #a7bfff; border-radius: 50%; animation: blink 1.4s infinite both; }
        
        @keyframes premiumScaleUp {
          from { transform: scale(0.9) translateY(40px); opacity: 0; filter: blur(10px); }
          to { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        
        @keyframes messageSlideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }

        .chat-fab { animation: fabPulse 2s infinite; }
        @keyframes fabPulse {
          0% { box-shadow: 0 0 0 0 rgba(167, 191, 255, 0.6); }
          70% { box-shadow: 0 0 0 20px rgba(167, 191, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(167, 191, 255, 0); }
        }
      `}</style>
    </>
  );
}
