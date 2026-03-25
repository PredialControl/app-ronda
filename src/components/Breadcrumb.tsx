import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors"
      >
        <Home className="w-4 h-4" />
      </button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-gray-600" />
          {index === items.length - 1 ? (
            <span className="text-white font-medium">{item.label}</span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-gray-400 hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
