import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="CityRadius home">
      <span className="brand-mark" aria-hidden="true">
        <Activity size={18} strokeWidth={2.4} />
      </span>
      {!compact && <span>CityRadius</span>}
    </Link>
  );
}
