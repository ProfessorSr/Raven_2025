export type AdminSubItem = { label: string; href: string; exact?: boolean };
export type AdminSection = { key: string; label: string; href: string; items?: AdminSubItem[] };
export const adminSections: AdminSection[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", items: [] },
  { key: "forms", label: "Forms", href: "/admin/forms", items: [
      { label: "Registration", href: "/admin/forms/registration" },
      { label: "Login", href: "/admin/forms/login" },
      { label: "Profile", href: "/admin/forms/profile" },
      { label: "Custom Forms", href: "/admin/forms" },
  ]},
  { key: "pages", label: "Pages", href: "/admin/pages", items: [
      { label: "All Pages", href: "/admin/pages" },
      { label: "Create Page", href: "/admin/pages/new" },
  ]},
];
export function findSectionByPath(path: string): AdminSection | undefined {
  const p = path.split("?")[0].split("#")[0].replace(/\/+$/, "");
  const segs = p.split("/").filter(Boolean);
  const sectionHref =
    segs.length >= 2 ? `/${segs[0]}/${segs[1]}` : `/${segs[0] || ""}`;
  return adminSections.find((s) => sectionHref.startsWith(s.href));
}
