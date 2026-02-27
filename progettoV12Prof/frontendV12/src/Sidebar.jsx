import { useState, useMemo, useEffect } from "react";
import "./styles/Sidebar.css";

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
  const [search, setSearch] = useState("");

  const [width, setWidth] = useState(
    Number(localStorage.getItem("sidebarWidth")) || 280
  );

  const [isResizing, setIsResizing] = useState(false);

  const MIN_WIDTH = 220;
  const MAX_WIDTH = 500;

  const filteredChats = useMemo(() => {
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, chats]);

  useEffect(() => {
    function handleMouseMove(e) {
      if (!isResizing) return;

      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, e.clientX)
      );

      setWidth(newWidth);
    }

    function handleMouseUp() {
      if (isResizing) {
        localStorage.setItem("sidebarWidth", width);
      }
      setIsResizing(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, width]);

  return (
    <div
      className="sidebar-container"
      style={{ width }}
    >
      {/* HEADER */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <h3>Chat</h3>
          <span className="chat-count">{chats.length}</span>
        </div>

        <button className="new-chat-btn" onClick={onNew}>
          + Nuova chat
        </button>

        <input
          className="chat-search"
          placeholder="Cerca chat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* LISTA */}
      <div className="sidebar-list">
        {filteredChats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            onMouseEnter={() => setHovered(chat.id)}
            onMouseLeave={() => {
              setHovered(null);
              setMenuOpen(null);
            }}
            className={`sidebar-item ${chat.id === activeId ? "active" : ""}`}
          >
            <span className="chat-title">
              {chat.title}
            </span>

            {hovered === chat.id && (
              <div
                className="three-dots"
                onClick={e => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === chat.id ? null : chat.id);
                }}
              >
                ⋮
              </div>
            )}

            {menuOpen === chat.id && (
              <div
                className="dropdown"
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="delete-option"
                  onClick={() => {
                    onDelete(chat.id);
                    setMenuOpen(null);
                  }}
                >
                  🗑 Elimina
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredChats.length === 0 && (
          <div className="empty-state">
            Nessuna chat trovata
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <button onClick={onBack}>
          ⬅ Torna al menu
        </button>
      </div>

      {/* RESIZE HANDLE */}
      <div
        className="resize-handle"
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
}
