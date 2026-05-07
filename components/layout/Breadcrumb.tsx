import * as React from "react";
import Link from "@/components/ui/Link";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-sans text-[11px] text-text-tertiary">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {item.href && !isLast ? (
              <Link href={item.href} className="text-[11px]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-text-tertiary" : ""}>{item.label}</span>
            )}
            {!isLast && <span className="mx-2 text-text-tertiary">·</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
