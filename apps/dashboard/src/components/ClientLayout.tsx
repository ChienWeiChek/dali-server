import { Outlet } from "react-router-dom";
import Header from "./Header";
import ToastProvider from "./ToastProvider";

export default function ClientLayout() {
  return (
    <ToastProvider>
      <Header />
      <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <Outlet /> {/* All nested routes will render here */}
      </main>
    </ToastProvider>
  );
}
