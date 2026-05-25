import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../components/ProfileModal";

export default function Header({ user }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadProfile() {
      if (!user?.email) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) {
        console.error("Error loading header profile:", error);
        return;
      }

      setProfile(data);
    }

    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    setProfileOpen(false);
  };

  const displayName =
    profile?.preferred_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0];

  return (
    <header className="flex justify-between items-center p-4 bg-gray-900 text-white z-50">
      <div className="bg-red-500">
        <h1
          className="cursor-pointer font-bold"
          onClick={() => navigate("/")}
        >
          TradeMatcher v2
        </h1>
      </div>

      {!user ? (
        <button onClick={() => navigate("/login")}>
          Login
        </button>
      ) : (
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setOpen(prev => !prev)}
          >
            <span>👤</span>
            <span className="text-sm font-semibold">{displayName}</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-4 bg-white text-black p-2 shadow rounded w-[140px] text-center z-50">
              <div
                className="cursor-pointer p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  setProfileOpen(true);
                  setOpen(false);
                }}
              >
                Profile
              </div>

              <div
                className="cursor-pointer p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  navigate("/collections");
                  setOpen(false);
                }}
              >
                Collections
              </div>

              <div
                className="cursor-pointer p-2 hover:bg-gray-100 rounded"
                onClick={() => {
                  navigate("#");
                  setOpen(false);
                }}
              >
                ISO
              </div>

              <div
                className="cursor-pointer mt-2 p-2 bg-red-600 text-white rounded"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      )}

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        onProfileSaved={setProfile}
      />
    </header>
  );
}
