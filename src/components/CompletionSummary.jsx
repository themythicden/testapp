import { getCollectionCompletion } from "../utils/completionUtils";

export default function CompletionSummary({
  cards,
  userCards,
  allUserCards,
  collectionUsers,
  selectedOwnerEmails,
  currentUserEmail,
  isCollab,
  setFilter,
  collection
}) {
  const completion = getCollectionCompletion({
    cards,
    userCards,
    allUserCards,
    collectionUsers,
    selectedOwnerEmails,
    isCollab,
    setFilter,
    collection
  });

  const getTitle = () => {
    if (!isCollab) return "My Completion";

    if (
      selectedOwnerEmails.length === 1 &&
      selectedOwnerEmails[0] === currentUserEmail
    ) {
      return "My Completion";
    }

    if (selectedOwnerEmails.length === collectionUsers.length) {
      return "Full Collection Completion";
    }

    return "Selected Users Completion";
  };

  return (
    <div className="mx-4 mb-4 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="
