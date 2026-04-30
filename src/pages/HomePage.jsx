export default function HomePage(user) {
  return (
    <div className="p-4">
        {user ? (
        <button onClick={() => navigate("/collections")}>
        Collections
        </button>
      ) : (
      
      )};
    </div>
  );
}
