import Card from "./Card";

export default function CardGrid({
  cards,
  userCards,
  allUserCards,
  collectionUsers,
  currentUserEmail,
  setFilter,
  statusFilter,
  onAdd,
  onRemove,
  isCollab,
  myRole,
  showMineOnly,
  selectedOwnerEmails
}) { // The opening brace must come immediately after the arguments
  
  //console.log("CARDGRID USERS:", collectionUsers);
  //console.log("CARDGRID ALLUSERCARDS:", allUserCards);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-2 pb-2">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          userCards={userCards}
          allUserCards={allUserCards}
          collectionUsers={collectionUsers}
          currentUserEmail={currentUserEmail}
          setFilter={setFilter}
          statusFilter={statusFilter}
          onAdd={onAdd}
          onRemove={onRemove}
          isCollab={isCollab}
            showMineOnly={showMineOnly}
          selectedOwnerEmails={selectedOwnerEmails}
        />
      ))}
    </div>
  );
}
