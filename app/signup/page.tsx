"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link
import styles from "./signup.module.css";
// import { supabase } from "@/lib/supabase"; // Bỏ import cũ
import { createBrowserClient } from '@supabase/ssr' // Dùng client giống trang login

// Khởi tạo Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match"); // Dịch
      return;
    }

    try {
      setLoading(true);
      
      // Sử dụng Supabase client trực tiếp thay vì API route (trừ khi bạn có lý do cụ thể)
      // Điều này đơn giản hơn và đồng bộ với trang login
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username, // Thêm username vào metadata (nếu RLS của bạn cho phép)
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      
      // Xử lý tạo profile sau khi sign up
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username: formData.username })
          .eq('id', data.user.id);

        if (profileError) {
          // Vẫn báo thành công, nhưng log lỗi profile
          console.error("Error updating profile:", profileError.message);
        }
      }

      setFormData({ username: "", email: "", password: "", confirmPassword: "" });
      alert("Signup successful! Please check your email to verify your account."); // Dịch
      router.push("/login");

    } catch (err: any) {
      setError(err.message || "Signup failed"); // Dịch
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: `${location.origin}/auth/callback`, // Dùng callback chuẩn
      }, 
    });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Form bên trái */}
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Create Account</h2>

            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder=""
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder=""
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder=""
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder=""
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Sign Up"}
            </button>

            {/* Dấu gạch "or" */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              className={styles.googleBtn}
              disabled={loading}
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                width={20}
                height={20}
              />
              Sign up with Google
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.signupText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.signupLink}>
                Login
              </Link>
            </p>
          </form>
        </div>

        {/* Panel bên phải */}
        <div className={styles.rightPanel}>
          <img
            src="https://cdn.dribbble.com/users/5325964/screenshots/11432898/media/f6a4fcbd45cb1cd36e1b2fb088a3eabc.png?compress=1&resize=840x630&vertical=top"
            alt="Shopping illustration"
            className={styles.illustration}
          />
        </div>

      </div>
    </div>
  );
}