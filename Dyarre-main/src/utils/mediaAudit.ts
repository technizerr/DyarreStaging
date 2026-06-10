import { supabase } from "@/integrations/supabase/client";

export type MediaAuditAction =
  | "upload"
  | "soft_delete"
  | "restore"
  | "purge"
  | "reapply"
  | "hard_delete";

interface AuditInput {
  action: MediaAuditAction;
  property_id?: string | null;
  image_id?: string | null;
  bucket?: string | null;
  path?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Insert a media audit log entry. Best-effort — failures are logged to the
 * console but never thrown, so they cannot break the calling media action.
 */
export async function logMediaAction(entry: AuditInput): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("media_audit_log").insert([{
      user_id: user.id,
      actor_email: user.email ?? undefined,
      action: entry.action,
      property_id: entry.property_id ?? undefined,
      image_id: entry.image_id ?? undefined,
      bucket: entry.bucket ?? undefined,
      path: entry.path ?? undefined,
      details: (entry.details ?? {}) as never,
    }]);
    if (error) console.warn("[mediaAudit] insert failed:", error.message);
  } catch (e) {
    console.warn("[mediaAudit] error:", e);
  }
}
