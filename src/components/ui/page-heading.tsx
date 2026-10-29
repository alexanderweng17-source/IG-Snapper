import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="เส้นทางนำทาง" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-faint">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {c.href ? <Link href={c.href} className="rounded hover:text-ink">{c.label}</Link> : <span aria-current="page" className="text-muted">{c.label}</span>}
            {i < items.length - 1 && <ChevronRight className="size-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeading({ title, description, crumbs, actions }: { title: string; description?: string; crumbs?: Crumb[]; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[1.7rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
