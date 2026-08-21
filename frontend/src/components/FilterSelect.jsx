export default function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="filter-field">
      <label htmlFor={id} className="filter-label">
        {label}
      </label>
      <select id={id} value={value} onChange={onChange} className="input-field">
        {children}
      </select>
    </div>
  );
}
