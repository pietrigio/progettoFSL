export default function Sidebar({ chats, activeId, onSelect, onNew }) {
  return (
    <div style={{ width: "260px", background: "#f4f4f4", padding: "10px" }}>
      <button onClick={onNew} style={{ width: "100%", marginBottom: "10px" }}>
        + Nuova chat
      </button>

      {chats.map(chat => (
        <div
          key={chat.id}
          onClick={() => onSelect(chat.id)}
          style={{
            padding: "8px",
            cursor: "pointer",
            background: chat.id === activeId ? "#ddd" : "transparent"
          }}
        >
          {chat.title}
        </div>
      ))}
    </div>
  );
}
