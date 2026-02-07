
import { useState } from "react";
import IndexManager from "./IndexManager";
import Chat from "./Chat";

export default function App() {
  const [index, setIndex] = useState(null);

  return (
    <>
      <IndexManager onSelect={setIndex} />
      {index && <Chat index={index} />}
    </>
  );
}




/** 
INSERIMENTO NOME E COGNOME
import { useState } from 'react'
import './App.css'

function App() {
  const [nome, setNome] = useState("")
  const [cognome, setCognome] = useState("");

  return (
    <>
      <h3>CIAO UTENTE:</h3>
      <h5>Come ti chiami?</h5>

      <input
        type = "text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <br/>

       <input
        type = "text"
        value={cognome}
        onChange={(e) => setCognome(e.target.value)}
      />

      <p>Ciao {nome} {cognome}</p>
      
    </>
  )
}

export default App
*/
/** 
 * PREDEFINITO
 *
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
 */