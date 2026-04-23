import Card from "./Card";

export default function CardGrid({ cards, userCards, setFilter, onAdd, onRemove }) {

  function buildUserData(cardId, userCards) {
  const data = {};

  Object.keys(userCards).forEach(key => {
    const [id, variant] = key.split("_");

    if (id === cardId) {
      data[variant] = userCards[key]?.total || 0;
    }
  });

  return data;
    
    console.log("NEW DATA: "+ data);
}
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          userData={buildUserData(card.id, userCards},
          setFilter={setFilter}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

