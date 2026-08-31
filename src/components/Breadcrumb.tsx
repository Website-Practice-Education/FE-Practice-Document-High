import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="mb-6 animate-fade-in-down">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <Link
            to="/"
            className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors duration-200"
          >
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-slate-300">/</span>
            {item.path ? (
              <Link
                to={item.path}
                className="text-indigo-500 hover:text-indigo-700 font-medium transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-500 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
