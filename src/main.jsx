import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 아이콘 폰트가 실제로 로드된 뒤에만 아이콘을 보여 줍니다 (로드 전 글자가 튀어나오지 않게)
if (document.fonts?.load) {
  document.fonts.load('24px "Material Symbols Outlined"', "home")
    .then(f => { if (f.length) document.documentElement.classList.add("icons-ready"); })
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
