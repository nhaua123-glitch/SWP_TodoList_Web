"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BackgroundApplier() {
  const pathname = usePathname();

  useEffect(() => {
    const apply = () => {
      try {
        const mode = localStorage.getItem('app_bg_mode');
        if (mode === 'color') {
          const color = localStorage.getItem('app_bg_color') || '#ffffff';
          document.body.style.backgroundImage = 'none';
          document.body.style.background = color;
          document.body.style.backgroundColor = color;
          document.body.style.setProperty('--background', color);
          document.body.style.setProperty('--accent', color);
        } else if (mode === 'image') {
          const img = localStorage.getItem('app_bg_image');
          if (img) {
            document.body.style.backgroundImage = `url(${img})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundColor = '';
            document.body.style.background = '';
            document.body.style.setProperty('--accent', '#e3c9ef');
          }
        }
      } catch {}
    };

    apply();

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('app_bg_')) apply();
    };
    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, [pathname]);

  return null;
}
