export default function OwnerFilters({
  collectionUsers = [],
  currentUserEmail,
  selectedOwnerEmails = [],
  setSelectedOwnerEmails
}) {
  const toggleUser = email => {
    if (selectedOwnerEmails.includes(email)) {
      setSelectedOwnerEmails(selectedOwnerEmails.filter(e => e !== email));
    } else {
      setSelectedOwnerEmails([...selectedOwnerEmails, email]);
    }
  };

  const showAll = () => {
    setSelectedOwnerEmails([]);
  };

  const showMineOnly = () => {
    if (!currentUserEmail) return;
    setSelectedOwnerEmails([currentUserEmail]);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 text-white space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={showAll}
          className={`px-3 py-1 rounded ${
            selectedOwnerEmails.length === 0 ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          Full collection
        </button>

        <button
          type="button"
          onClick={showMineOnly}
          className={`px-3 py-1 rounded ${
            selectedOwnerEmails.length === 1 &&
            selectedOwnerEmails[0] === currentUserEmail
              ? "bg-green-600"
              : "bg-gray-700"
          }`}
        >
          Mine only
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {collectionUsers.map(user => {
          const active = selectedOwnerEmails.includes(user.email);

          return (
            <label
              key={user.email}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                active ? "bg-green-700" : "bg-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggleUser(user.email)}
              />

              <span>
                {user.email === currentUserEmail
                  ? "You"
                  : user.name || user.email.split("@")[0]}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
