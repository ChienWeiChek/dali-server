import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ToastProvider from "./ToastProvider";

export default function ClientLayout() {
  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 w-full">
          <Outlet /> {/* All nested routes will render here */}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
