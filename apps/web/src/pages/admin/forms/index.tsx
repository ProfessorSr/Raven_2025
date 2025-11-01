import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import SectionLayout from "@/components/admin/SectionLayout";
import * as formsApi from "@/lib/apiForms";

export default function FormsLibraryPage() {
  const [adminToken, setAdminToken] = React.useState("");
  const [list, setList] = React.useState<any[]>([]);
  const [err, setErr] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [slug, setSlug] = React.useState("contact");
  const [title, setTitle] = React.useState("Contact Us");
  const [description, setDescription] = React.useState("");

  const load = React.useCallback(async () => {
    setErr("");
    try {
      const tok = localStorage.getItem("raven_admin_token") || "";
      setAdminToken(tok);
      const out = await formsApi.listForms(tok);
      setList(out.forms || []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load forms");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await formsApi.createForm({ slug, title, description }, adminToken);
      setCreating(false);
      setSlug("");
      setTitle("");
      setDescription("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    }
  };

  const nav = [
    { href: "/admin/forms/registration", label: "Registration" },
    { href: "/admin/forms/login", label: "Login" },
    { href: "/admin/forms/profile", label: "Profile" },
  ];

  const sidebarExtra = (
    <button
      onClick={() => setCreating((s) => !s)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {creating ? "Close" : "+ New Custom Form"}
    </button>
  );

  return (
    <AdminLayout title="Forms">
      <SectionLayout title="Forms" nav={nav} sidebarExtra={sidebarExtra}>
        {creating && (
          <form
            onSubmit={onCreate}
            style={{ margin: "8px 0 16px", display: "grid", gap: 8, maxWidth: 520 }}
          >
            <label>
              Slug
              <br />
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="contact"
                required
              />
            </label>
            <label>
              Title
              <br />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contact Us"
                required
              />
            </label>
            <label>
              Description
              <br />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <div>
              <button type="submit">Create</button>
            </div>
          </form>
        )}

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <h3 style={{ marginTop: 0 }}>Custom Forms</h3>
        {list.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No custom forms yet. Use “New Custom Form” to add one.</p>
        ) : (
          <ul>
            {list.map((f: any) => (
              <li key={f.id}>
                <a href={`/admin/forms/${encodeURIComponent(f.slug)}`}>
                  {f.title}{" "}
                  <small style={{ opacity: 0.6 }}>({f.slug})</small>
                </a>
              </li>
            ))}
          </ul>
        )}
      </SectionLayout>
    </AdminLayout>
  );
}
