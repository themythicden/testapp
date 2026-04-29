import { useState } from "react";
import { inviteUserToCollection } from "../utils/collabUtils";

export default function InviteUser({ collectionId, myRole }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const handleInvite = async () => {
    if (!email) return;

    const res = await inviteUserToCollection({
      collectionId,
      email,
      role
    });

    if (res.success) {
      alert("User invited!");
      setEmail("");
    }
  };

  return (
    <div className="bg-gray-800 p-3 rounded mt-4 space-y-2">
      <h3 className="text-white font-bold">Invite User</h3>

      <input
        type="email"
        placeholder="User email..."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 text-white"
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full p-2 rounded bg-gray-700 text-white"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
      </select>

      <button
        onClick={handleInvite}
        className="bg-blue-600 px-3 py-1 rounded text-white w-full"
      >
        Invite
      </button>
    </div>
  );
}
