export interface SiteConfig {
  key: string;
  label: string;
  apiUrl: string;
  apiUser: string;
  apiPass: string;
}

/** Build site configs from environment variables.
 *  For each site, expects:
 *    SITE_{KEY}_URL, SITE_{KEY}_USER, SITE_{KEY}_PASS, SITE_{KEY}_LABEL
 */
export function getSiteConfigs(): SiteConfig[] {
  const sites: SiteConfig[] = [];
  const keys = new Set<string>();

  for (const envKey of Object.keys(process.env)) {
    const match = envKey.match(/^SITE_([A-Z0-9]+)_URL$/);
    if (match) keys.add(match[1]);
  }

  for (const key of keys) {
    const apiUrl = process.env[`SITE_${key}_URL`];
    const apiUser = process.env[`SITE_${key}_USER`];
    const apiPass = process.env[`SITE_${key}_PASS`];
    const label = process.env[`SITE_${key}_LABEL`] ?? key;

    if (apiUrl && apiUser && apiPass) {
      sites.push({ key: key.toLowerCase(), label, apiUrl, apiUser, apiPass });
    }
  }

  return sites;
}

export function getSiteConfig(siteKey: string): SiteConfig | undefined {
  return getSiteConfigs().find((s) => s.key === siteKey);
}
