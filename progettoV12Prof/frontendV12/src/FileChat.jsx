import { useEffect, useState, useRef } from "react";
import "./styles/FileChat.css";

export default function FileChat({ onBack }) {
  const [indexes, setIndexes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [openIndexMenu, setOpenIndexMenu] = useState(null);

  const [hoveredFile, setHoveredFile] = useState(null);
  const [openFileMenu, setOpenFileMenu] = useState(null);

  const [newName, setNewName] = useState("");
  const [files, setFiles] = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [openViewer, setOpenViewer] = useState(null);
  const [viewerContent, setViewerContent] = useState("");
  const [viewerQuery, setViewerQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 🔥 SIDEBAR RESIZE
  const [sidebarWidth, setSidebarWidth] = useState(
    Number(localStorage.getItem("fileSidebarWidth")) || 300
  );
  const [isResizing, setIsResizing] = useState(false);
  const MIN_WIDTH = 240;
  const MAX_WIDTH = 600;

  // 🔥 SEARCH
  const [searchIndex, setSearchIndex] = useState("");
  const [searchFile, setSearchFile] = useState("");

  useEffect(() => {
    loadIndexes();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!openViewer) return;

    const elements = document.querySelectorAll(".match-highlight");
    if (!elements.length) return;

    elements.forEach(el => el.classList.remove("active-match"));

    const current = elements[currentMatchIndex];
    if (current) {
      current.classList.add("active-match");
      current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [currentMatchIndex, openViewer]);

  // 🔥 Resize logic
  useEffect(() => {
    function handleMouseMove(e) {
      if (!isResizing) return;

      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, e.clientX)
      );

      setSidebarWidth(newWidth);
    }

    function handleMouseUp() {
      if (isResizing) {
        localStorage.setItem("fileSidebarWidth", sidebarWidth);
      }
      setIsResizing(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  function loadIndexes() {
    fetch("http://localhost:8000/indexes")
      .then(res => res.json())
      .then(async data => {
        setIndexes(data);

        if (data.length === 0) {
          setSelected(null);
          setFiles([]);
          setMessages([]);
          return;
        }

        const lastUsed = localStorage.getItem("lastIndex");
        const indexToSelect =
          lastUsed && data.includes(lastUsed)
            ? lastUsed
            : data[0];

        await selectIndex(indexToSelect);
      });
  }

  function loadFiles(index) {
    fetch(`http://localhost:8000/files/${index}`)
      .then(res => res.json())
      .then(setFiles);
  }

  async function selectIndex(name) {
    setSelected(name);
    localStorage.setItem("lastIndex", name);
    setOpenIndexMenu(null);

    loadFiles(name);

    const res = await fetch(`http://localhost:8000/index-chat/${name}`);
    const data = await res.json();
    setMessages(data);
  }

  async function deleteIndex(name) {
    await fetch(`http://localhost:8000/index/${name}`, {
      method: "DELETE"
    });

    if (localStorage.getItem("lastIndex") === name) {
      localStorage.removeItem("lastIndex");
    }

    setSelected(null);
    setFiles([]);
    setMessages([]);
    setOpenIndexMenu(null);
    loadIndexes();
  }

  async function deleteFile(filename) {
    await fetch(
      `http://localhost:8000/file/${selected}/${filename}`,
      { method: "DELETE" }
    );

    setOpenFileMenu(null);
    loadFiles(selected);
  }

  async function createIndex() {
    if (!newName.trim()) return;

    const res = await fetch("http://localhost:8000/create-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });

    const data = await res.json();
    if (data.ok) {
      setNewName("");
      loadIndexes();
    }
  }

  async function uploadFileDirect(file) {
    if (!selected || !file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(
      `http://localhost:8000/upload-file/${selected}`,
      { method: "POST", body: form }
    );

    const data = await res.json();
    if (data.ok) setFiles(data.files);
  }

  async function uploadFile(e) {
    uploadFileDirect(e.target.files[0]);
  }

  async function send() {
    if (!input.trim() || !selected) return;

    const question = input;
    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", text: question }
    ]);

    setLoading(true);

    const res = await fetch("http://localhost:8000/search-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index: selected,
        question: question
      })
    });

    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }

  function scrollToMatch(index) {
    const elements = document.querySelectorAll(".match-highlight");
    if (!elements.length) return;

    elements.forEach(el => el.classList.remove("active-match"));

    const current = elements[index];
    if (current) {
      current.classList.add("active-match");
      current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }

  function nextMatch() {
    if (matchCount === 0) return;
    const next = (currentMatchIndex + 1) % matchCount;
    setCurrentMatchIndex(next);
  }

  function prevMatch() {
    if (matchCount === 0) return;
    const prev = (currentMatchIndex - 1 + matchCount) % matchCount;
    setCurrentMatchIndex(prev);
  }

  function highlightText(text, query) {
    if (!query) return text;

    const words = query.split(" ").filter(w => w.trim());
    let highlighted = text;

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(
        regex,
        `<mark class="match-highlight">$1</mark>`
      );
    });

    return highlighted;
  }

  async function openFileViewer(filename, query) {
    const res = await fetch(
      `http://localhost:8000/file-content/${selected}/${filename}`
    );
    const data = await res.json();

    if (data.content) {
      const highlighted = highlightText(data.content, query);
      const count =
        (highlighted.match(/class="match-highlight"/g) || []).length;

      setMatchCount(count);
      setCurrentMatchIndex(0);
      setViewerContent(highlighted);
      setViewerQuery(query);
      setOpenViewer(filename);

      setTimeout(() => scrollToMatch(0), 100);
    }
  }

  const filteredIndexes = indexes.filter(i =>
    i.toLowerCase().includes(searchIndex.toLowerCase())
  );

  const filteredFiles = files.filter(f =>
    f.toLowerCase().includes(searchFile.toLowerCase())
  );

  return (
    <div className="filechat-container">

      {/* SIDEBAR */}
      <div
        className={`filechat-sidebar ${isDragging ? "dragging" : ""}`}
        style={{ width: sidebarWidth }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          uploadFileDirect(file);
        }}
      >
        <div className="sidebar-content">
          <h3>Indici ({indexes.length})</h3>

          <input
            className="sidebar-search"
            placeholder="Cerca indice..."
            value={searchIndex}
            onChange={e => setSearchIndex(e.target.value)}
          />

          {filteredIndexes.map(name => (
            <div
              key={name}
              onClick={() => selectIndex(name)}
              onMouseEnter={() => setHoveredIndex(name)}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setOpenIndexMenu(null);
              }}
              className={`index-item ${selected === name ? "active" : ""}`}
            >
              <span>{name}</span>

              {hoveredIndex === name && (
                <div
                  className="three-dots"
                  onClick={e => {
                    e.stopPropagation();
                    setOpenIndexMenu(openIndexMenu === name ? null : name);
                  }}
                >
                  ⋮
                </div>
              )}

              {openIndexMenu === name && (
                <div
                  className="dropdown"
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className="delete-option"
                    onClick={() => {
                      deleteIndex(name);
                      setOpenIndexMenu(null);
                    }}
                  >
                    🗑 Elimina
                  </div>
                </div>
              )}
            </div>
          ))}

          <hr />

          <input
            placeholder="Nuovo indice"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button onClick={createIndex}>
            Crea indice
          </button>

          <hr />
          <input type="file" onChange={uploadFile} />

          <h4 className="file-section-title">
            File ({files.length})
          </h4>

          <input
            className="sidebar-search"
            placeholder="Cerca file..."
            value={searchFile}
            onChange={e => setSearchFile(e.target.value)}
          />

          {filteredFiles.map(f => (
            <div
              key={f}
              onMouseEnter={() => setHoveredFile(f)}
              onMouseLeave={() => {
                setHoveredFile(null);
                setOpenFileMenu(null);
              }}
              className="file-item"
            >
              <span>📄 {f}</span>

              {hoveredFile === f && (
                <div
                  className="three-dots"
                  onClick={e => {
                    e.stopPropagation();
                    setOpenFileMenu(openFileMenu === f ? null : f);
                  }}
                >
                  ⋮
                </div>
              )}

              {openFileMenu === f && (
                <div
                  className="dropdown"
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className="delete-option"
                    onClick={() => {
                      deleteFile(f);
                      setOpenFileMenu(null);
                    }}
                  >
                    🗑 Elimina
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>


        <div className="sidebar-footer">
          <button onClick={onBack}>
            ⬅ Torna al menu
          </button>
        </div>

        <div
          className="resize-handle"
          onMouseDown={() => setIsResizing(true)}
        />
      </div>

      {/* CHAT AREA INALTERATA */}
      <div className="chat-area">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="bubble">
                {m.text}
              </div>

              {m.role === "bot" && m.files && (
                <div className="file-results">
                  {m.files.length === 0 && (
                    <div className="no-files">
                      Nessun file trovato
                    </div>
                  )}

                  {m.files.map((f, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        openFileViewer(f.filename, m.query)
                      }
                      className="open-file-btn"
                    >
                      📂 Apri {f.filename}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="bubble bot loading">
              🔎 Sto cercando nei file...
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Scrivi cosa cercare..."
          />
          <button onClick={send}>Cerca</button>
        </div>
      </div>

      {/* MODAL invariato */}
      {openViewer && (
        <div
          className="modal-overlay"
          onClick={() => setOpenViewer(null)}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{openViewer}</h2>

              <div className="match-controls">
                <button onClick={prevMatch}>⬆</button>
                <span>
                  {matchCount === 0 ? 0 : currentMatchIndex + 1} / {matchCount}
                </span>
                <button onClick={nextMatch}>⬇</button>
                <button onClick={() => setOpenViewer(null)}>✖</button>
              </div>
            </div>

            <div className="modal-download">
              <a
                href={`http://localhost:8000/download/${selected}/${openViewer}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📥 Scarica file
              </a>
            </div>

            <div
              className="file-content"
              dangerouslySetInnerHTML={{ __html: viewerContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
