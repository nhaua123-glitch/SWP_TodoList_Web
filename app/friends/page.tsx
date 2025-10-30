"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FriendsClient from "./FriendsClient";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login"); // Chưa login → redirect
    } else {
      setUser(JSON.parse(storedUser)); // Đã login → parse user
    }
  }, [router]);

  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>⏳ Đang kiểm tra đăng nhập...</div>;

  return <FriendsClient user={user} />;
}
