import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center max-w-2xl p-6 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-extrabold text-pink-500 mb-4">
          Welcome to ToDoList App
        </h1>
        <p className="text-gray-700 mb-6 text-lg">
          Quản lý công việc hàng ngày của bạn một cách dễ dàng và hiệu quả.  
          Với ứng dụng <span className="font-semibold">ToDoList</span>, bạn có thể:
        </p>
        <ul className="text-left list-disc list-inside mb-6 text-gray-600">
          <li>Thêm, sửa, xóa công việc nhanh chóng</li>
          <li>Đánh dấu công việc đã hoàn thành</li>
          <li>Quản lý thời gian tốt hơn và tăng hiệu suất</li>
        </ul>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-5 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </main>
  );
}
