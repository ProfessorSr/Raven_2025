import { api } from "@/lib/api";

export async function listForms(adminToken: string) {
  return api.get("/v0/admin/forms", {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  }) as Promise<{ forms: Array<{ id: string; slug: string; title: string; is_active: boolean; is_published?: boolean }> }>;
}

export async function createForm(
  body: { slug: string; title: string; description?: string; is_active?: boolean; is_published?: boolean },
  adminToken: string
) {
  return api.post("/v0/admin/forms", body, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function updateForm(
  formId: string,
  patch: Partial<{ slug: string; title: string; description: string | null; is_active: boolean; is_published: boolean }>,
  adminToken: string
) {
  return api.put(`/v0/admin/forms/${encodeURIComponent(formId)}`, patch, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function deleteForm(formId: string, adminToken: string) {
  return api.del(`/v0/admin/forms/${encodeURIComponent(formId)}`, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function getFormBySlug(slug: string) {
  return api.get(`/v0/form/${encodeURIComponent(slug)}`, { credentials: "include" }) as Promise<{
    form: any;
    fields: Array<{
      id?: string;
      _placement_id?: string;
      key: string;
      label?: string;
      type?: string;
      required?: boolean;
      visible?: boolean;
      help_text?: string | null;
      order_index?: number;
      write_to?: "core" | "attributes";
      validation_regex?: string | null;
      min_length?: number | null;
      max_length?: number | null;
      options?: string[] | null;
    }>;
  }>;
}

export async function addFieldToForm(formId: string, payload: any, adminToken: string) {
  return api.post(`/v0/admin/forms/${encodeURIComponent(formId)}/fields`, payload, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function updatePlacement(
  formId: string,
  placementId: string,
  patch: Partial<{
    required: boolean;
    visible: boolean;
    help_text: string | null;
    order_index: number;
    label: string;
    type: string;
    write_to: "core" | "attributes";
    validation_regex: string | null;
    min_length: number | null;
    max_length: number | null;
    options: string[] | null;
  }>,
  adminToken: string
) {
  return api.put(`/v0/admin/forms/${encodeURIComponent(formId)}/fields/${encodeURIComponent(placementId)}`, patch, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function deletePlacement(formId: string, placementId: string, adminToken: string) {
  return api.del(`/v0/admin/forms/${encodeURIComponent(formId)}/fields/${encodeURIComponent(placementId)}`, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}

export async function reorderForm(
  formId: string,
  items: { id: string; order_index: number }[],
  adminToken: string
) {
  return api.post(`/v0/admin/forms/${encodeURIComponent(formId)}/reorder`, { items }, {
    headers: { "x-admin-token": adminToken, Accept: "application/json" },
    credentials: "include",
  });
}
