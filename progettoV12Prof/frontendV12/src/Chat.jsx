import { useEffect, useRef, useState } from "react";
import "./styles/Chat.css";

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ chat, onUpdate }) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  // sincronizza messaggi quando cambio chat
  useEffect(() => {
    if (!chat) return;

    setLocalMessages(
      chat.messages.map(m => ({
        ...m,
        timestamp: m.timestamp || formatTime(),
      }))
    );
  }, [chat]);

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, loading]);

  // 🔥 WEBSOCKET UNA SOLA VOLTA
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      wsRef.current = ws;
    };

    ws.onmessage = (e) => {
      if (e.data === "__END__") {
        setLoading(false);
        return;
      }

      setLocalMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          text: updated[lastIndex].text + e.data,
        };

        // 🔥 aggiorna parent SENZA funzione
        onUpdate({
          ...chat,
          messages: updated,
        });

        return updated;
      });
    };

    return () => ws.close();
  }, []);

  if (!chat) return null;

  function send() {
    if (!input.trim()) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log("WebSocket non pronto");
      return;
    }

    const question = input;

    const newMessages = [
      ...localMessages,
      { role: "user", text: question, timestamp: formatTime() },
      { role: "bot", text: "", timestamp: formatTime() },
    ];

    setLocalMessages(newMessages);
    setLoading(true);

    const updatedChat = {
      ...chat,
      title:
        chat.messages.length === 0
          ? question.slice(0, 30)
          : chat.title,
      messages: newMessages,
    };

    onUpdate(updatedChat);

    wsRef.current.send(JSON.stringify({ question }));
    setInput("");
  }

  return (
    <div className="chat-container">

      <div className="chat-messages-area">
        {localMessages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role} animate-in`}>
            <div className="avatar">
              {m.role === "user" ? "🧑" : "🤖"}
            </div>

            <div className="message-content">
              <div className={`bubble ${m.role}`}>
                {m.text}
              </div>
              <div className="timestamp">{m.timestamp}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message bot animate-in">
            <div className="avatar">🤖</div>
            <div className="message-content">
              <div className="bubble bot skeleton"></div>
              <div className="timestamp">{formatTime()}</div>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <div className="chat-input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Scrivi un messaggio..."
        />
        <button onClick={send}>Invia</button>
      </div>
    </div>
  );
}