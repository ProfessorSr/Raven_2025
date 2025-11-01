// Mounted at /v0
import { Router, Request, Response } from "express";
import * as Svc from "./customForms.service";
import { requireAdmin } from "../../middleware/requireRole";

const router = Router();

// Public: fetch a custom form by slug
router.get("/form/:slug", async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const data = await Svc.getFormBySlug(slug);
    if (!data) return res.status(404).json({ error: "Form not found" });
    return res.json(data);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to load form" });
  }
});

// Public: submit a custom form
router.post("/form/:slug/submit", async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug is required" });
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const userId = (req as any).user?.id || null;
    const result = await Svc.submit(slug, payload, { userId });
    return res.json(result || { ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Submission failed" });
  }
});

// Admin: list forms
router.get("/admin/forms", requireAdmin, async (_req, res) => {
  try {
    const list = await Svc.listForms();
    return res.json({ forms: list });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to list forms" });
  }
});

// Admin: create form
router.post("/admin/forms", requireAdmin, async (req, res) => {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { slug, title, description, is_active } = body;
    if (!slug || !title) return res.status(400).json({ error: "slug and title are required" });
    const form = await Svc.createForm({
      slug,
      title,
      description: description ?? null,
      is_active: is_active !== false
    });
    return res.json(form);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to create form" });
  }
});

// Admin: get one
router.get("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    const form = await Svc.getFormById(String(req.params.id));
    if (!form) return res.status(404).json({ error: "Form not found" });
    return res.json(form);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to load form" });
  }
});

// Admin: update
router.put("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const patch: any = {};
    if (typeof body.slug !== "undefined") patch.slug = body.slug;
    if (typeof body.title !== "undefined") patch.title = body.title;
    if (typeof body.description !== "undefined") patch.description = body.description;
    if (typeof body.is_active !== "undefined") patch.is_active = !!body.is_active;
    const out = await Svc.updateForm(id, patch);
    return res.json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to update form" });
  }
});

// Admin: delete
router.delete("/admin/forms/:id", requireAdmin, async (req, res) => {
  try {
    await Svc.deleteForm(String(req.params.id));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to delete form" });
  }
});

// Admin: add/update placement
router.post("/admin/forms/:id/fields", requireAdmin, async (req, res) => {
  try {
    const formId = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const out = await Svc.addOrUpdatePlacement({
      form_id: formId,
      field_id: body.field_id,
      key: body.key,
      required: body.required,
      visible: body.visible,
      help_text: body.help_text,
      order_index: body.order_index,
      base: {
        label: body.label,
        type: body.type,
        write_to: body.write_to,
        validation_regex: body.validation_regex,
        min_length: body.min_length,
        max_length: body.max_length,
        options: body.options
      }
    });
    return res.json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to add field" });
  }
});

// Admin: reorder
router.post("/admin/forms/:id/reorder", requireAdmin, async (req, res) => {
  try {
    const formId = String(req.params.id);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return res.status(400).json({ error: "items[] is required" });
    await Svc.reorderForm(
      formId,
      items.map((it: any) => ({ id: String(it.id), order_index: Number(it.order_index) }))
    );
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to reorder" });
  }
});

// Admin: update an existing placement on a custom form
router.put("/admin/forms/:formId/fields/:placementId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const formId = String(req.params.formId || "");
    const placementId = String(req.params.placementId || "");
    if (!formId || !placementId) return res.status(400).json({ error: "formId and placementId are required" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    const out = await Svc.updatePlacement(formId, placementId, {
      required: typeof body.required === "boolean" ? body.required : undefined,
      visible: typeof body.visible === "boolean" ? body.visible : undefined,
      help_text: typeof body.help_text === "string" ? body.help_text : (typeof body.help_text === "undefined" ? undefined : body.help_text),
      order_index: typeof body.order_index === "number" ? body.order_index : undefined,
      base: {
        label: body.label,
        type: body.type,
        write_to: body.write_to,
        validation_regex: body.validation_regex,
        min_length: body.min_length,
        max_length: body.max_length,
        options: body.options,
      },
    });

    return res.json(out);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to update placement" });
  }
});

// Admin: delete a placement from a custom form
router.delete("/admin/forms/:formId/fields/:placementId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const formId = String(req.params.formId || "");
    const placementId = String(req.params.placementId || "");
    if (!formId || !placementId) return res.status(400).json({ error: "formId and placementId are required" });

    await Svc.deletePlacement(formId, placementId);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Failed to delete placement" });
  }
});

export default router;
