/**
 * IANA Time Zones (tzdb)
 * Source: IANA Time Zone Database
 */
export interface Timezone {
  id: string;          // IANA timezone identifier
  name: string;        // Display name
  offset: string;      // UTC offset (standard)
  abbr: string;        // Common abbreviation
  region: string;      // Geographic region
}

export const timezones: Timezone[] = [
  // UTC
  { id: "UTC", name: "Coordinated Universal Time", offset: "+00:00", abbr: "UTC", region: "UTC" },

  // Africa
  { id: "Africa/Abidjan", name: "Abidjan", offset: "+00:00", abbr: "GMT", region: "Africa" },
  { id: "Africa/Cairo", name: "Cairo", offset: "+02:00", abbr: "EET", region: "Africa" },
  { id: "Africa/Casablanca", name: "Casablanca", offset: "+01:00", abbr: "WET", region: "Africa" },
  { id: "Africa/Johannesburg", name: "Johannesburg", offset: "+02:00", abbr: "SAST", region: "Africa" },
  { id: "Africa/Lagos", name: "Lagos", offset: "+01:00", abbr: "WAT", region: "Africa" },
  { id: "Africa/Nairobi", name: "Nairobi", offset: "+03:00", abbr: "EAT", region: "Africa" },

  // America
  { id: "America/Anchorage", name: "Anchorage", offset: "-09:00", abbr: "AKST", region: "America" },
  { id: "America/Argentina/Buenos_Aires", name: "Buenos Aires", offset: "-03:00", abbr: "ART", region: "America" },
  { id: "America/Bogota", name: "Bogota", offset: "-05:00", abbr: "COT", region: "America" },
  { id: "America/Chicago", name: "Chicago (Central)", offset: "-06:00", abbr: "CST", region: "America" },
  { id: "America/Denver", name: "Denver (Mountain)", offset: "-07:00", abbr: "MST", region: "America" },
  { id: "America/Halifax", name: "Halifax (Atlantic)", offset: "-04:00", abbr: "AST", region: "America" },
  { id: "America/Lima", name: "Lima", offset: "-05:00", abbr: "PET", region: "America" },
  { id: "America/Los_Angeles", name: "Los Angeles (Pacific)", offset: "-08:00", abbr: "PST", region: "America" },
  { id: "America/Mexico_City", name: "Mexico City", offset: "-06:00", abbr: "CST", region: "America" },
  { id: "America/New_York", name: "New York (Eastern)", offset: "-05:00", abbr: "EST", region: "America" },
  { id: "America/Phoenix", name: "Phoenix (No DST)", offset: "-07:00", abbr: "MST", region: "America" },
  { id: "America/Santiago", name: "Santiago", offset: "-03:00", abbr: "CLT", region: "America" },
  { id: "America/Sao_Paulo", name: "São Paulo", offset: "-03:00", abbr: "BRT", region: "America" },
  { id: "America/St_Johns", name: "St. John's (Newfoundland)", offset: "-03:30", abbr: "NST", region: "America" },
  { id: "America/Toronto", name: "Toronto", offset: "-05:00", abbr: "EST", region: "America" },
  { id: "America/Vancouver", name: "Vancouver", offset: "-08:00", abbr: "PST", region: "America" },

  // Asia
  { id: "Asia/Bangkok", name: "Bangkok", offset: "+07:00", abbr: "ICT", region: "Asia" },
  { id: "Asia/Dhaka", name: "Dhaka", offset: "+06:00", abbr: "BST", region: "Asia" },
  { id: "Asia/Dubai", name: "Dubai", offset: "+04:00", abbr: "GST", region: "Asia" },
  { id: "Asia/Hong_Kong", name: "Hong Kong", offset: "+08:00", abbr: "HKT", region: "Asia" },
  { id: "Asia/Jakarta", name: "Jakarta", offset: "+07:00", abbr: "WIB", region: "Asia" },
  { id: "Asia/Jerusalem", name: "Jerusalem", offset: "+02:00", abbr: "IST", region: "Asia" },
  { id: "Asia/Karachi", name: "Karachi", offset: "+05:00", abbr: "PKT", region: "Asia" },
  { id: "Asia/Kolkata", name: "Kolkata (Mumbai)", offset: "+05:30", abbr: "IST", region: "Asia" },
  { id: "Asia/Kuala_Lumpur", name: "Kuala Lumpur", offset: "+08:00", abbr: "MYT", region: "Asia" },
  { id: "Asia/Manila", name: "Manila", offset: "+08:00", abbr: "PHT", region: "Asia" },
  { id: "Asia/Seoul", name: "Seoul", offset: "+09:00", abbr: "KST", region: "Asia" },
  { id: "Asia/Shanghai", name: "Shanghai (Beijing)", offset: "+08:00", abbr: "CST", region: "Asia" },
  { id: "Asia/Singapore", name: "Singapore", offset: "+08:00", abbr: "SGT", region: "Asia" },
  { id: "Asia/Taipei", name: "Taipei", offset: "+08:00", abbr: "CST", region: "Asia" },
  { id: "Asia/Tehran", name: "Tehran", offset: "+03:30", abbr: "IRST", region: "Asia" },
  { id: "Asia/Tokyo", name: "Tokyo", offset: "+09:00", abbr: "JST", region: "Asia" },

  // Atlantic
  { id: "Atlantic/Azores", name: "Azores", offset: "-01:00", abbr: "AZOT", region: "Atlantic" },
  { id: "Atlantic/Reykjavik", name: "Reykjavik", offset: "+00:00", abbr: "GMT", region: "Atlantic" },

  // Australia
  { id: "Australia/Adelaide", name: "Adelaide", offset: "+09:30", abbr: "ACST", region: "Australia" },
  { id: "Australia/Brisbane", name: "Brisbane", offset: "+10:00", abbr: "AEST", region: "Australia" },
  { id: "Australia/Darwin", name: "Darwin", offset: "+09:30", abbr: "ACST", region: "Australia" },
  { id: "Australia/Melbourne", name: "Melbourne", offset: "+10:00", abbr: "AEST", region: "Australia" },
  { id: "Australia/Perth", name: "Perth", offset: "+08:00", abbr: "AWST", region: "Australia" },
  { id: "Australia/Sydney", name: "Sydney", offset: "+10:00", abbr: "AEST", region: "Australia" },

  // Europe
  { id: "Europe/Amsterdam", name: "Amsterdam", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Athens", name: "Athens", offset: "+02:00", abbr: "EET", region: "Europe" },
  { id: "Europe/Berlin", name: "Berlin", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Brussels", name: "Brussels", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Dublin", name: "Dublin", offset: "+00:00", abbr: "GMT", region: "Europe" },
  { id: "Europe/Helsinki", name: "Helsinki", offset: "+02:00", abbr: "EET", region: "Europe" },
  { id: "Europe/Istanbul", name: "Istanbul", offset: "+03:00", abbr: "TRT", region: "Europe" },
  { id: "Europe/Lisbon", name: "Lisbon", offset: "+00:00", abbr: "WET", region: "Europe" },
  { id: "Europe/London", name: "London", offset: "+00:00", abbr: "GMT", region: "Europe" },
  { id: "Europe/Madrid", name: "Madrid", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Moscow", name: "Moscow", offset: "+03:00", abbr: "MSK", region: "Europe" },
  { id: "Europe/Oslo", name: "Oslo", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Paris", name: "Paris", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Prague", name: "Prague", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Rome", name: "Rome", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Stockholm", name: "Stockholm", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Vienna", name: "Vienna", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Warsaw", name: "Warsaw", offset: "+01:00", abbr: "CET", region: "Europe" },
  { id: "Europe/Zurich", name: "Zurich", offset: "+01:00", abbr: "CET", region: "Europe" },

  // Pacific
  { id: "Pacific/Auckland", name: "Auckland", offset: "+12:00", abbr: "NZST", region: "Pacific" },
  { id: "Pacific/Fiji", name: "Fiji", offset: "+12:00", abbr: "FJT", region: "Pacific" },
  { id: "Pacific/Guam", name: "Guam", offset: "+10:00", abbr: "ChST", region: "Pacific" },
  { id: "Pacific/Honolulu", name: "Honolulu", offset: "-10:00", abbr: "HST", region: "Pacific" },
  { id: "Pacific/Samoa", name: "Samoa", offset: "-11:00", abbr: "SST", region: "Pacific" },
];

export const timezoneRegions = ["UTC", "Africa", "America", "Asia", "Atlantic", "Australia", "Europe", "Pacific"];

export function getTimezoneById(id: string): Timezone | undefined {
  return timezones.find((tz) => tz.id === id);
}

export function getTimezonesByRegion(region: string): Timezone[] {
  return timezones.filter((tz) => tz.region === region);
}

export function getCurrentTimezoneOffset(): string {
  const offset = new Date().getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset <= 0 ? "+" : "-";
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimezoneDisplay(tz: Timezone): string {
  return `(UTC${tz.offset}) ${tz.name}`;
}
