import { useState, useRef, useEffect } from "react";

const SESSION_ID = "user_" + Math.random().toString(36).slice(2, 9);

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm Sahayak Assistant 👋 How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", { // ✅ Fixed port
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: trimmed, session_id: SESSION_ID }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "bot", text: data.bot_response }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ Couldn't reach the server. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "sans-serif" }}>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: 360,
          height: 500,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginBottom: 12,
          border: "1px solid #e2e8f0"
        }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#fff",
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>🛠️ Sahayak Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>● Online</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: "rgba(255,255,255,0.2)",
              border: "none", color: "#fff",
              borderRadius: 8, padding: "4px 10px",
              cursor: "pointer", fontSize: 16
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: 10,
            background: "#f8fafc"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#1e293b",
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 16px", background: "#fff",
                  borderRadius: "16px 16px 16px 4px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  fontSize: 18, letterSpacing: 2
                }}>•••</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: "flex", gap: 8, padding: "10px 12px",
            borderTop: "1px solid #e2e8f0", background: "#fff"
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              style={{
                flex: 1, padding: "9px 14px",
                borderRadius: 10, border: "1px solid #e2e8f0",
                fontSize: 13.5, outline: "none",
                background: "#f8fafc"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "9px 16px",
                background: loading || !input.trim() ? "#c7d2fe" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "#fff", border: "none",
                borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 13.5
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#fff", border: "none",
            cursor: "pointer", fontSize: 24,
            boxShadow: "0 4px 16px rgba(79,70,229,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s"
          }}
          title="Chat with Sahayak"
        >
          {isOpen ? "✕" : "💬"}
        </button>
      </div>
    </div>
  );
}