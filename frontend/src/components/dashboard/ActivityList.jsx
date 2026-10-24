import FieldTags from "./FieldTags";

export default function ActivityList({ items }) {
  return (
    <ol className="activity">
      {items.map((item) => (
        <li className="activity__item" key={item.id}>
          <span
            className={`activity__dot${item.type.includes("rechazada") ? " is-danger" : ""}`}
          />
          <div className="activity__body">
            <div className="activity__head">
              <strong>{item.site}</strong>
              <span className="activity__date">{item.date}</span>
            </div>
            <span className="text-muted">{item.type}</span>
            {item.fields.length > 0 && <FieldTags fields={item.fields} />}
          </div>
        </li>
      ))}
    </ol>
  );
}
