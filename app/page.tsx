import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to My App</h1>
        <Link
          href="/login"
          className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition"
        >
          Go to Login
        </Link>
      </div>
    </main>
  );
}




