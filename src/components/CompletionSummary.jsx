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
    currentUserEmail,
    isCollab,
    setFilter,
    collection
  });

  return (
    <div className="bg-gray-800 p-4 text-white">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-bold text-lg">{completion.title}</h3>
          <p className="text-md text-gray-400">
            {completion.owned} / {completion.total} collected
          </p>
        </div>

        <div className="text-2xl font-bold text-green-400">
          {completion.percentage}%
        </div>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-green-500 h-3 rounded-full transition-all"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>
    </div>
  );
}
