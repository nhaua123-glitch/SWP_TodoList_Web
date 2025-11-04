"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FriendsClient from "./FriendsClient";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // 👈 Dùng hàm này

export default function Page() {
  const router = useRouter();
  
  // 1. Tạo client Supabase ĐÚNG CÁCH (chỉ 1 lần)
  const [supabase] = useState(() => createClientComponentClient());
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // 2. Lấy user thật sự, KHÔNG DÙNG localStorage
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login"); // Chưa login → redirect
      } else {
        setUser(user); // Đã login → set user
      }
      setLoading(false);
    };

    fetchUser();
  }, [router, supabase]);

  // Hiển thị loading trong khi chờ
  if (loading || !user) {
    return <div style={{ padding: 40, textAlign: "center" }}>⏳ Đang kiểm tra đăng nhập...</div>;
  }

  // 3. Truyền cả 'user' và 'supabase' xuống cho con
  return <FriendsClient user={user} supabase={supabase} />;
}