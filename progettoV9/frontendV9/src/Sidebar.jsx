import { useState } from "react";

export default function Sidebar({
  chats = [],
  activeId,
  onSelect,
  onNew,
  onBack,
  onDelete
}) {
  const [hovered, setHovered] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  return (
    <div
      style={{
        width: "260px",
        background: "#f4f4f4",
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "10px" }}>
        <button onClick={onNew} style={{ width: "100%" }}>
          + Nuova chat
        </button>
      </div>

      {/* LISTA CHAT */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px"
        }}
      >
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}   // 👈 ora cliccabile tutto il riquadro
            onMouseEnter={() => setHovered(chat.id)}
            onMouseLeave={() => {
              setHovered(null);
              setMenuOpen(null);
            }}
            style={{
              position: "relative",
              padding: "8px",
              cursor: "pointer",
              background: chat.id === activeId ? "#ddd" : "transparent",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>
              {chat.title}
            </span>

            {/* 3 puntini */}
            {hovered === chat.id && (
              <div
                onClick={e => {
                  e.stopPropagation();   // 👈 evita che selezioni la chat
                  setMenuOpen(menuOpen === chat.id ? null : chat.id);
                }}
                style={{
                  padding: "0 6px",
                  cursor: "pointer"
                }}
              >
                ⋮
              </div>
            )}

            {/* MENU */}
            {menuOpen === chat.id && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  padding: 6,
                  zIndex: 10,
                  minWidth: 80
                }}
              >
                <div
                  onClick={() => {
                    onDelete(chat.id);
                    setMenuOpen(null);
                  }}
                  style={{
                    cursor: "pointer",
                    color: "red"
                  }}
                >
                  🗑 Elimina
                </div>
              </div>
            )}
          </div>
        ))}

      </div>

      {/* FOOTER */}
      <div
        style={{
          height: "56px",
          padding: "10px",
          borderTop: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box"
        }}
      >
        <button onClick={onBack} style={{ width: "100%" }}>
          ⬅ Torna al menu
        </button>
      </div>
    </div>
  );
}
