import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

const cityMap = {
  "Western Cape": ["Cape Town", "Stellenbosch", "Paarl", "George"],
  "Gauteng": ["Johannesburg", "Pretoria", "Centurion", "Sandton"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Umhlanga"],
  "Eastern Cape": ["Gqeberha", "East London"],
  "Free State": ["Bloemfontein"],
  "Limpopo": ["Polokwane"],
  "Mpumalanga": ["Mbombela"],
  "North West": ["Rustenburg"],
  "Northern Cape": ["Kimberley"]
};

export default function ProfileModal({ open, onClose, user }) {
  const [preferredName, setPreferredName] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  async function loadProfile() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (data) {
      setPreferredName(data.preferred_name || "");
      setProvince(data.province || "");
      setCity(data.city || "");
    }
  }

  async function handleSave() {
    setSaving(true);

    await supabase.from("profiles").upsert({
      email: user.email,
      preferred_name: preferredName.trim(),
      province,
      city
    });

    setSaving(false);
    onClose();
  }

  const suggestions = useMemo(() => {
    const list = cityMap[province] || [];

    if (!city) return list.slice(0, 6);

    return list
      .filter(c =>
        c.toLowerCase().includes(city.toLowerCase())
      )
      .slice(0, 6);
  }, [province, city]);

  if (!open) return null;

  return (
    <div id="profileModal" className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 z-48">
      <div className="bg-zinc-900 text-white w-full max-w-md rounded-2xl p-5 space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">👤 Profile</h2>

          <button
            onClick={onClose}
            className="text-xl"
          >
            ✖
          </button>
        </div>

        {/* Preferred Name */}
        <div>
          <label className="text-sm text-zinc-400">
            Preferred Name
          </label>

          <input
            maxLength={15}
            value={preferredName}
            onChange={(e) =>
              setPreferredName(e.target.value)
            }
            placeholder="Max 15 characters"
            className="w-full mt-1 bg-zinc-800 rounded-xl px-3 py-2 outline-none"
          />

          <p className="text-xs text-zinc-500 mt-1">
            {preferredName.length}/15
          </p>
        </div>

        {/* Province */}
        <div>
          <label className="text-sm text-zinc-400">
            Province
          </label>

          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setCity("");
            }}
            className="w-full mt-1 bg-zinc-800 rounded-xl px-3 py-2 outline-none"
          >
            <option value="">Select Province</option>

            {Object.keys(cityMap).map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="relative">
          <label className="text-sm text-zinc-400">
            City / Town
          </label>

          <input
            value={city}
            disabled={!province}
            onFocus={() => setShowSug(true)}
            onChange={(e) => {
              setCity(e.target.value);
              setShowSug(true);
            }}
            placeholder={
              province
                ? "Start typing city..."
                : "Select province first"
            }
            className="w-full mt-1 bg-zinc-800 rounded-xl px-3 py-2 outline-none disabled:opacity-50"
          />

          {showSug && suggestions.length > 0 && (
            <div className="absolute w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-50">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setCity(s);
                    setShowSug(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-zinc-700"
                >
                  📍 {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-700 rounded-xl py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 rounded-xl py-2 font-semibold"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

      </div>
    </div>
  );
}
