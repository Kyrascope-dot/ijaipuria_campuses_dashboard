export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { getSiteConfigs } = await import("@/lib/sites");
    const { syncSite } = await import("@/services/sync");

    // Run sync every 7 days (Sunday at 2:00 AM)
    cron.default.schedule("0 2 * * 0", async () => {
      console.log("[Auto-Sync] Starting scheduled sync for all campuses...");
      const sites = getSiteConfigs();
      for (const site of sites) {
        try {
          await syncSite(site);
          console.log(`[Auto-Sync] ${site.label} synced successfully`);
        } catch (error: any) {
          console.error(`[Auto-Sync] ${site.label} sync failed:`, error.message);
        }
      }
      console.log("[Auto-Sync] Scheduled sync complete");
    });

    console.log("[Auto-Sync] Cron job scheduled: every Sunday at 2:00 AM");
  }
}
