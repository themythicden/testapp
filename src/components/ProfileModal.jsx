/*await supabase
  .from("profiles")
  .upsert({
    email: user.email,
    preferred_name,
    city,
    province,
    country: "South Africa"
  });

[
 "Western Cape",
 "Gauteng",
 "KwaZulu-Natal",
 "Eastern Cape",
 "Free State",
 "Limpopo",
 "Mpumalanga",
 "North West",
 "Northern Cape"
]*/

// ProfileModal.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const provinces = [
  "Western Cape",
  "Gauteng",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape"
];

export default function ProfileModal({ user, open, onClose }) {
  const [preferredName, setPreferredName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (open) loadProfile();
  }, [open]);

  async function loadProfile() {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (data) {
      setPreferredName(data.preferred_name || "");
      setCity(data.city || "");
      setProvince(data.province || "");
    }
  }

  async function saveProfile() {
    if (!user) return;

    if (preferredName.length > 15) {
      setMsg("Preferred name max 15 characters.");
      return;
    }

    setLoading(true);
    setMsg("");

    const { error } = await supabase
      .from("profiles")
      .upsert({
        email: user.email,
        preferred_name: preferredName,
        city,
        province,
        country: "South Africa"
      });

    setLoading(false);

    if (error) {
      setMsg("Failed to save profile.");
      return;
    }

    setMsg("Profile saved.");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 w-full max-w-md rounded-xl p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Preferred Name
            </label>
            <input
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              maxLength={15}
              className="w-full bg-gray-800 p-2 rounded"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              City
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-800 p-2 rounded"
              placeholder="Cape Town"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Province
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full bg-gray-800 p-2 rounded"
            >
              <option value="">Select Province</option>
              {provinces.map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            onClick={saveProfile}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          {msg && (
            <p className="text-center text-sm text-green-400">
              {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
