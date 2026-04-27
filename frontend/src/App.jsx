import { useEffect, useState } from "react";

const pageStyle = {
  minHeight: "100vh",
  margin: 0,
  display: "grid",
  placeItems: "center",
  fontFamily: "Arial, sans-serif",
  background: "#f7f7f7",
  color: "#222",
};

const headingStyle = {
  fontSize: "48px",
  margin: 0,
};

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:8000/api/hello")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Could not load message"));
  }, []);

  return (
    <main style={pageStyle}>
      <h1 style={headingStyle}>{message}</h1>
    </main>
  );
}

export default App;
