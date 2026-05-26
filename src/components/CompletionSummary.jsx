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
    <div className="sticky top-0 z-30 bg-gray-950 border-b border-gray-800 px-4 py-3">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-base">
              {completion.title}
            </h3>

            <p className="text-sm text-gray-400">
              {completion.owned} / {completion.total} collected
            </p>
          </div>

          <div className="text-2xl font-bold text-green-400">
            {completion.percentage}%
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
