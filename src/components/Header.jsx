import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../components/ProfileModal";

export default function Header({ user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); 
  //const userEmail = user.email;
  //console.log("Usserrr: ", user.user_metadata.email);
  //const userName = user.name;
  //const username = userName ? userEmail.split('@')[0] : "";
  //

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-gray-900 text-white z-50">
      <p className="text-white"></p>
      <h1 className="cursor-pointer" onClick={() => navigate("/")}>
        🧢 My TCG App
      </h1>

      {!user ? (
        <button onClick={() => navigate("/login")}>
        Login
        </button>
      ) : (
        <div className="relative">
          <div
            className="cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            👤
          </div>

          {open && (
            <div className="absolute right-0 mt-2 bg-white text-black p-2 shadow">
              <div
                className="cursor-pointer"
                onClick={() => {
                  setShowProfile(true);
                  setOpen(false);
                }}
              >
                Profile
              </div>
              <div
                className="cursor-pointer"
                onClick={() => {
                  navigate("/collections");
                  setOpen(false);
                }}
              >
                My Collections
              </div>

              <button onClick={() => navigate("/")}>
                ISO
              </button>

              <div
                className="cursor-pointer mt-2"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      )}
      {showProfile && (
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
        />
      )}
    </header>
  );
}
