import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CollectionsPage from "./pages/CollectionsPage";
import { useEffect, useState } from "react";
import { supabase } from "./lib//supabaseClient";
import LoginPage from "./pages/LoginPage";
import CollectionPage from "./pages/CollectionPage";
import ISOPage from "./pages/ISOPage";


export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // get current session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/collections" element={<CollectionsPage user={user} />} />
          <Route path="/collection" element={<CollectionPage user={user} />} />
          <Route path="/iso" element={<ISOPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
