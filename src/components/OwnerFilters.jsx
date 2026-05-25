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

  const selectAll = () => {
    setSelectedOwnerEmails(collectionUsers.map(u => u.email));
  };

  const onlyMine = () => {
    if (!currentUserEmail) return;
    setSelectedOwnerEmails([currentUserEmail]);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 text-white space-y-3 mx-4 mb-4">
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={selectAll} className="bg-gray-700 px-3 py-1 rounded">
          All Users
        </button>

        <button type="button" onClick={onlyMine} className="bg-green-700 px-3 py-1 rounded">
          Only Mine
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {collectionUsers.map(user => {
          const checked = selectedOwnerEmails.includes(user.email);

          return (
            <label key={user.email} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
              <input
                type="checkbox"
                checked={checked}
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
