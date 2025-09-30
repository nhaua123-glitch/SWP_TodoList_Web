import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";  // login page
import App from "./App";               // page chính sau khi login

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />   {/* default */}
      <Route path="/app" element={<App />} />      {/* page sau khi login */}
    </Routes>
  </BrowserRouter>
);
