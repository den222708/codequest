/**
 * Notification Service — server-side notification creation helper.
 *
 * Fire-and-forget: every helper returns Promise<void> and logs errors
 * internally rather than throwing, so callers (route handlers) are never
 * blocked by a failed notification insert.
 */

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";

const log = createChildLogger({ module: "notify" });

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "assessment"
  | "submission"
  | "system";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

// ── Core helper ──────────────────────────────────────────────────────

/** Sanitize notification link: only allow relative paths (no external URLs) */
function sanitizeLink(link?: string): string | null {
  if (!link) return null;
  // Only allow relative paths starting with / (but not // which is protocol-relative)
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  // Block all absolute URLs (including http/https) to prevent phishing
  return null;
}

/** Insert a single notification row. Fire-and-forget. */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: sanitizeLink(params.link),
    });
    if (error) log.error({ err: error }, "insert failed");
  } catch (err) {
    log.error({ err }, "unexpected error");
  }
}

/** Insert notifications for multiple users at once. Fire-and-forget. */
export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
): Promise<void> {
  if (userIds.length === 0) return;
  try {
    const supabase = getSupabaseAdmin();
    const safeLink = sanitizeLink(link);
    const rows = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      link: safeLink,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) log.error({ err: error }, "bulk insert failed");
  } catch (err) {
    log.error({ err }, "bulk unexpected error");
  }
}

// ── Domain-specific helpers ──────────────────────────────────────────

/** Notify all students enrolled in classes that an assessment was assigned to. */
export async function notifyAssessmentPublished(
  assessmentId: string,
  assessmentTitle: string,
  classIds: string[],
): Promise<void> {
  if (classIds.length === 0) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data: enrollments, error } = await supabase
      .from("class_enrollments")
      .select("student_id")
      .in("class_id", classIds);
    if (error || !enrollments) return;

    const studentIds = [...new Set(enrollments.map((e) => e.student_id))];
    await createBulkNotifications(
      studentIds,
      "New Assessment Available",
      `"${assessmentTitle}" has been published. Check it out!`,
      "assessment",
      `/assessments/${assessmentId}`,
    );
  } catch (err) {
    log.error({ err, assessmentId }, "assessmentPublished error");
  }
}

/** Notify the student that their submission has been graded / test results ready. */
export async function notifySubmissionGraded(
  studentId: string,
  assessmentTitle: string,
  questionTitle: string,
  passed: number,
  total: number,
): Promise<void> {
  const allPassed = passed === total;
  await createNotification({
    userId: studentId,
    title: allPassed ? "All Tests Passed!" : "Submission Results Ready",
    message: `${questionTitle} — ${passed}/${total} tests passed.`,
    type: allPassed ? "success" : "submission",
  });
}

/** Notify professor when a student completes an assessment attempt. */
export async function notifyAttemptCompleted(
  professorId: string,
  studentName: string,
  assessmentTitle: string,
  score: number,
  maxScore: number,
): Promise<void> {
  await createNotification({
    userId: professorId,
    title: "Student Completed Assessment",
    message: `${studentName} completed "${assessmentTitle}" — ${score}/${maxScore} points.`,
    type: "assessment",
  });
}

/** Notify a newly created user about their account. */
export async function notifyAccountCreated(
  userId: string,
  role: string,
): Promise<void> {
  await createNotification({
    userId,
    title: "Welcome to CodeQuest!",
    message: `Your ${role} account has been created. Get started by exploring the dashboard.`,
    type: "info",
    link: "/dashboard",
  });
}

/** Notify all admins about a system event. */
export async function notifyAdmins(
  title: string,
  message: string,
  type: NotificationType = "system",
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: admins } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("role", "admin")
      .eq("status", "active");
    if (!admins || admins.length === 0) return;
    await createBulkNotifications(admins.map((a) => a.user_id), title, message, type);
  } catch (err) {
    log.error({ err }, "notifyAdmins error");
  }
}
