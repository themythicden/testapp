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
  isCollab
}) { // The opening brace must come immediately after the arguments
  
  //console.log("CARDGRID USERS:", collectionUsers);
  //console.log("CARDGRID ALLUSERCARDS:", allUserCards);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
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
        />
      ))}
    </div>
  );
}
