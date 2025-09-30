"use client";
import { useState } from "react";
import styles from './login.module.css';

export default function LoginPage() {
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    // Demo check giả lập
    if (username !== "admin" || password !== "123") {
      setError("Sai username hoặc mật khẩu!");
    } else {
      setError("");
      alert("Đăng nhập thành công!");
      // hoặc chuyển trang ...
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Login</h2>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" name="username" />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" />
            <button type="submit">Login</button>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        <div className={styles.rightPanel}>
          <img
            src="https://lacemade.com/cdn/shop/files/logo_55354c7e-2cf6-4a7c-bcf3-f83d1c8ac0d2_230x.png?v=1747985772"
            alt="logo"
            style={{ maxWidth: '220px', marginBottom: '20px' }}
          />
          <p>
            Spend a sweet summer with LaceMade and more exciting things are waiting for you to discover.
          </p>
          <img
            src="https://lacemade.com/cdn/shop/files/2_e003ffac-8ca6-454a-9f48-e5435c086ad6_1800x.jpg?v=1747726087"
            alt="Shopping illustration"
            style={{ marginTop: '30px' }}
          />
        </div>
      </div>
    </div>
  );
}





