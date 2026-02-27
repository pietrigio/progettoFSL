import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' //collega React al DOM (come html viene salvato) del browser
import './styles/index.css' //importa gli stili 
import App from './App.jsx' //importa il file app.jsx come una classe

createRoot(document.getElementById('root')).render(
  /**
   * document.getElementById('root') -> prende il div con id="root" in index.html
   * create root -> crea la radice dell'app root
   * render -> cosa "disegna" il react dentro
   */
  <StrictMode>
    <App />
  </StrictMode>,
  /**
   * app -> componenente principale
   * strictmode -> controlli e warning
   * index.html
      └── <div id="root"></div>
           ↑
          React monta App qui
   */
)
