import { useEffect, useRef, useState } from "react";

export default function Chat({ chat, onUpdate }) {
  const [input, setInput] = useState("");
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws");

    wsRef.current.onmessage = e => {
      if (e.data === "__END__") return;

      const messages = [...chat.messages];
      messages[messages.length - 1].text += e.data;

      onUpdate({ ...chat, messages });
    };

    return () => wsRef.current.close();
  }, [chat]);

  function send() {
    if (!input.trim()) return;

    const updatedChat = { ...chat };

    // titolo = primo messaggio
    if (updatedChat.messages.length === 0) {
      updatedChat.title = input.slice(0, 30);
    }

    updatedChat.messages.push({ role: "user", text: input });
    updatedChat.messages.push({ role: "bot", text: "" });

    onUpdate(updatedChat);

    wsRef.current.send(JSON.stringify({ question: input }));
    setInput("");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {chat.messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: "10px"
            }}
          >
            <span
              style={{
                padding: "8px",
                background: m.role === "user" ? "#007bff" : "#eee",
                color: m.role === "user" ? "#fff" : "#000",
                borderRadius: "6px"
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", padding: "10px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          style={{ flex: 1 }}
          placeholder="Scrivi un messaggio..."
        />
        <button onClick={send}>Invia</button>
      </div>
    </div>
  );
}
