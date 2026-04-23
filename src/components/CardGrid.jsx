import Card from "./Card";

export default function CardGrid({ cards, userCards, setFilter, onAdd, onRemove }) {


  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          userCards={userCards}
          setFilter={setFilter}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

