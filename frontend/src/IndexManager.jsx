import { useEffect, useState } from "react";

export default function IndexManager({ onSelect }) {
  const [indices, setIndices] = useState([]);
  const [name, setName] = useState("");

  function loadIndexes() {
    fetch("/index")
      .then(r => r.json())
      .then(setIndices);
  }

  useEffect(() => {
    loadIndexes();
  }, []);

  function createIndex() {
    fetch("/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    }).then(loadIndexes); // 🔥 aggiorna la lista
  }

  return (
    <div>
      <input
        placeholder="nome_indice"
        onChange={e => setName(e.target.value)}
      />
      <button onClick={createIndex}>Crea indice</button>

      {indices.map(i => (
        <div key={i} onClick={() => onSelect(i)}>
          {i}
        </div>
      ))}
    </div>
  );
}


/** 
INDEX INIZIALE
import { useEffect, useState } from "react";

export default function IndexManager({ onSelect }) {
  const [indices, setIndices] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/index")
      .then(r => r.json())
      .then(setIndices);
  }, []);

  function createIndex() {
    fetch("http://localhost:3000/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
  }

  return (
    <div>
      <input
        placeholder="nome_indice"
        onChange={e => setName(e.target.value)}
      />
      <button onClick={createIndex}>Crea indice</button>

      {indices.map(i => (
        <div key={i} onClick={() => onSelect(i)}>
          {i}
        </div>
      ))}
    </div>
  );
}

*/