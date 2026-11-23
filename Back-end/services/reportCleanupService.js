
import cron from "node-cron";
import Report from "../models/Report.js";

/**
 * Removes expired report snapshots while preserving
 * the report documents and their moderation history.
 */
export async function cleanupExpiredReportSnapshots() {
  const now = new Date();

  const result = await Report.updateMany(
    {
      snapshotExpiresAt: {
        $type: "date",
        $lte: now,
      },
      postSnapshot: {
        $exists: true,
      },
    },
    {
      $unset: {
        postSnapshot: 1,
      },
      $set: {
        snapshotExpiresAt: null,
      },
    }
  );

  console.log(
    `[Report Cleanup] Completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`
  );

  return result;
}

/**
 * Schedules automatic cleanup daily at 3:00 AM Japan time.
 */
export function startReportCleanupJob() {
  const task = cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("[Report Cleanup] Starting scheduled cleanup...");

      try {
        await cleanupExpiredReportSnapshots();
      } catch (error) {
        console.error(
          "[Report Cleanup] Scheduled cleanup failed:",
          error
        );
      }
    },
    {
      timezone: "Asia/Tokyo",
      noOverlap: true,
    }
  );

  console.log(
    "[Report Cleanup] Scheduled daily at 3:00 AM (Asia/Tokyo)."
  );

  return task;
}
