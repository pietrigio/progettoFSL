# Progetto FSL:

Questo progetto consiste nella creazione del frontend di un'applicazione web di
Intelligenza artificiale per un'azienda start-up di Belluno, utilizzando il
framework React di JavaScript.

**aggiunta spiegazione delle funzionalita' del frontend e specifiche tecniche**

Oltre al frontend e' presente anche un backend scritto in Fast Api per simulare
quello presente nel server.

**cambierei questo paragrafo, non credo che serva andare cosi' nello specifico**

Il progetto riguarda un sistema RAG per chatbot, che ha il compito di recuperare
dati (ad esempio verbali o documenti privati) e generare una risposta a partire
da essi, tramite un collegamento web socket.


## Funzionalita':

Per quanto riguarda il frontend, questo comprende:
- L'inserimento, modifica, lettura e cancellamento (CRUD) di 'indici', cioe'
  degli argomenti specifici salvati nel database vettoriale del server;
- Le stesse operazione CRUD devono poter essere applicate anche per dei file PDF,
  si in modalita' di caricamento singolo sia se si vanno a selezionare delle
  cartelle;
