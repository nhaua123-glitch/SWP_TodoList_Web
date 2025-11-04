"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FriendsClient from "./FriendsClient";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const check = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    };
    check();
  }, [router]);

  if (!user) return <div style={{ padding: 40, textAlign: "center" }}>⏳ Đang kiểm tra đăng nhập...</div>;

  return <FriendsClient user={user} />;
}
