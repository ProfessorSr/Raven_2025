import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type NavItem = { href: string; label: string };

type Props = {
  title: string;
  nav?: NavItem[];
  /** Optional extra node rendered beneath the sidebar nav (e.g., a button) */
  sidebarExtra?: React.ReactNode;
  children: React.ReactNode;
};

export default function SectionLayout({ title, nav = [], sidebarExtra, children }: Props) {
  const router = useRouter();
  const rawPath = (router as any)?.asPath || "";
  const activePath = React.useMemo(() => {
    const p = rawPath.split("?")[0].split("#")[0].replace(/\/+$/, "");
    return p || "/";
  }, [rawPath]);

  const hasSidebar = nav.length > 0 || !!sidebarExtra;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: hasSidebar ? "220px 1fr" : "1fr",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      {hasSidebar && (
        <aside
          style={{
            borderRight: "1px solid #e5e7eb",
            padding: "20px 16px",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {nav.length > 0 && (
            <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nav.map((item) => {
                const target = item.href.replace(/\/+$/, "");
                const isActive = activePath === target || activePath.startsWith(target + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      display: "block",
                      padding: "10px 12px",
                      borderRadius: 10,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      color: isActive ? "#1e40af" : "#1e3a8a",
                      background: isActive ? "#ffffff" : "#eff6ff",
                      border: isActive ? "1px solid #c7d2fe" : "1px solid #bfdbfe",
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      transition: "all .15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "#dbeafe";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "#eff6ff";
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {sidebarExtra ? <div>{sidebarExtra}</div> : null}
        </aside>
      )}

      <section style={{ minWidth: 0 }}>
        <header
          style={{
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#fafafa",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{title}</h2>
        </header>
        <main style={{ padding: 16 }}>{children}</main>
      </section>
    </div>
  );
}
