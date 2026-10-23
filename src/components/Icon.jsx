export default function Icon({ name, fill = false, className = "" }) {
  return <span className={`icon ${fill ? "icon-fill" : ""} ${className}`} aria-hidden="true">{name}</span>;
}
