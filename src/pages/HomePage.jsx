
import { useNavigate } from "react-router-dom";

export default function HomePage(user) {
  return (
    <div className="p-4">
        {user ? (
        <button onClick={() => navigate("/collections")}>
        Collections
        </button>
      ) : (
      <p>Signup / Login to get started.</p>
      )};
    </div>
  );
}
