# Progetto FSL:

Questa repository contiene il progetto di formazione scuola-lavoro 2025-2026 di
Pietro De Col ed Enrico Dal Pan.

Questo progetto consiste nella creazione del front end di un'applicazione web di
intelligenza artificiale per un'azienda start-up di Belluno, utilizzando il
framework React per JavaScript.
Il progetto riguarda un sistema RAG per chatbot, che ha il compito di recuperare
dati (ad esempio verbali o documenti privati) e generare una risposta a partire
da essi.

Il sistema utilizza un modello LLM (Large Language Model), che rappresenta il
"cervello" dell’applicazione: una grande massa di numeri, paragonabile al
funzionamento del cervello umano.
In questo caso il sistema utilizza un modello da 120 miliardi di parametri.
La comunicazione avviene tramite API, che inviano la risposta a una nostra
richiesta in streaming, utilizzando i WebSocket durante la fase di inferenza.

## Funzionalita':

Dal nostro lato dobbiamo realizzare l’interfaccia, che comprende:
- Un database vettoriale (con vettori di circa 700 dimensioni) utilizzato per
verificare se più stringhe hanno lo stesso significato semantico;
- La possibilità di creare argomenti tramite indici: l’utente inserisce solo
stringhe (che non devono contenere spazi) e queste vengono gestite nel database
vettoriale secondo un’architettura CRUD;
- La possibilità per l’utente di selezionare un indice tramite click per caricare
file PDF;
- La possibilità di eliminare file PDF già caricati;
- Una funzionalità che permetta di caricare file, anche sotto forma di cartelle.


## Roadmap

I prossi passi nel development sono:
- Aggiunta interfaccia: sidebar per indici e prompt stile chatgpt;
- Optional: keyboard shortcuts; 
