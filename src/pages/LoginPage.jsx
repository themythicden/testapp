import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/collections");
  };

  const handleSignup = async () => {
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setError(error.message);
      return;
    }

    alert("Check your email to confirm signup");
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <div className="bg-white p-6 shadow w-80">
        <h2 className="text-xl mb-4">Login</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 mb-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
    
            <input
              type="password"
              placeholder="Password"
              className="w-full border p-2 mb-4"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
    
            {error && (
              <div className="text-red-500 mb-2">{error}</div>
            )}
    
            <button
              onClick={handleLogin}
              className="w-full bg-black text-white p-2 mb-2"
            >
              Login
            </button>
        </form>
            <button
              onClick={handleSignup}
              className="w-full border p-2"
            >
              Sign Up
            </button>
      </div>
    </div>
  );
}
