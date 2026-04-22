import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function Layout({ user }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
