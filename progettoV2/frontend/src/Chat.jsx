import { useState } from "react";

export default function Chat({ index }) {
  const [msg, setMsg] = useState("");
  const [answer, setAnswer] = useState("");

  function send() {
    setAnswer("");
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      ws.send(JSON.stringify({ question: msg, index }));
    };

    ws.onmessage = e => {
      if (e.data === "__END__") ws.close();
      else setAnswer(a => a + e.data);
    };
  }

  return (
    <div>
      <input onChange={e => setMsg(e.target.value)} />
      <button onClick={send}>Invia</button>
      <p>{answer}</p>
    </div>
  );
}
