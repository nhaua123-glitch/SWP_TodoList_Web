import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./login.module.css";

export default function LoginPage() {
  const [error, setError] = useState("");
  const navigate = useNavigate(); // hook điều hướng

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    // check tài khoản (giữ nguyên code cũ)
    if (username === "admin" && password === "123") {
      setError("");
      navigate("/app"); // ✅ chuyển sang App.js
    } else {
      setError("Sai username hoặc mật khẩu!");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleLogin}>
            <h2>Login</h2>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" name="username" placeholder="Enter username" />
            
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" placeholder="Enter password" />
            
            <button type="submit">Login</button>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        <div className={styles.rightPanel}>
          <img src="https://source.unsplash.com/600x400/?nature,flowers" alt="Login" />
          <p>Chào mừng bạn đến với ứng dụng!</p>
        </div>
      </div>
    </div>
  );
}
