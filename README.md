
# Demo-Todolist
Website theo dõi thói quen

---

# Ứng dụng Next.js với Supabase Authentication

Ứng dụng Next.js sử dụng Supabase để xác thực người dùng, bao gồm đăng ký, đăng nhập và quản lý phiên đăng nhập.

Ứng dụng Next.js sử dụng Supabase để xác thực người dùng, bao gồm đăng ký, đăng nhập và quản lý phiên đăng nhập.

## Tính năng

- Đăng ký người dùng
- Đăng nhập
- Đăng xuất
- Bảo vệ route với middleware
- Dashboard người dùng

## Cài đặt

1. Clone repository

```bash
git clone <repository-url>
cd my-app
```

2. Cài đặt dependencies

```bash
npm install
```

3. Thiết lập Supabase

- Tạo tài khoản tại [Supabase](https://supabase.com)
- Tạo dự án mới
- Lấy URL và Anon Key từ dự án của bạn
- Tạo file `.env.local` từ file `.env.local.example` và điền thông tin Supabase của bạn

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Lưu ý**: Biến `NEXT_PUBLIC_SITE_URL` được sử dụng cho chức năng xác thực email và chuyển hướng sau khi xác thực.

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại [http://localhost:3000](http://localhost:3000)

## Cấu trúc dự án

- `/app` - Các trang và components của ứng dụng
- `/app/api` - API routes
- `/lib` - Thư viện và utilities
- `/public` - Tài nguyên tĩnh

## API Routes

- `/api/auth/register` - Đăng ký người dùng mới
- `/api/auth/login` - Đăng nhập
- `/api/auth/logout` - Đăng xuất
- `/api/auth/user` - Lấy thông tin người dùng hiện tại

## Công nghệ sử dụng

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/)
- [TailwindCSS](https://tailwindcss.com/)
