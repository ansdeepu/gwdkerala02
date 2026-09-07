// Utility for Kerala / India Public Holidays and Working Day Calculations

export const KERALA_FIXED_PUBLIC_HOLIDAYS = [
  { mmdd: "01-26", name: "Republic Day" },
  { mmdd: "05-01", name: "May Day" },
  { mmdd: "08-15", name: "Independence Day" },
  { mmdd: "10-02", name: "Gandhi Jayanthi" },
  { mmdd: "11-01", name: "Kerala Piravi" },
  { mmdd: "12-25", name: "Christmas" },
];

// Comprehensive Gazetted Public Holidays for Kerala (2023 - 2030)
// Includes movable religious and cultural holidays (Eid, Onam, Vishu, Good Friday, Mahanavami, Deepavali, etc.)
export const KERALA_GAZETTED_HOLIDAYS: Record<string, string> = {
  // 2023
  "2023-01-02": "Mannam Jayanthi",
  "2023-01-26": "Republic Day",
  "2023-02-18": "Maha Shivaratri",
  "2023-04-06": "Maundy Thursday",
  "2023-04-07": "Good Friday",
  "2023-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2023-04-21": "Id-ul-Fitr (Ramzan)",
  "2023-04-22": "Id-ul-Fitr (Ramzan)",
  "2023-05-01": "May Day",
  "2023-06-28": "Bakrid (Id-ul-Adha)",
  "2023-06-29": "Bakrid (Id-ul-Adha)",
  "2023-07-28": "Muharram",
  "2023-08-15": "Independence Day",
  "2023-08-28": "First Onam / Ayyankali Jayanthi",
  "2023-08-29": "Thiruvonam",
  "2023-08-30": "Third Onam",
  "2023-08-31": "Fourth Onam / Sree Narayana Guru Jayanthi",
  "2023-09-22": "Sree Narayana Guru Samadhi",
  "2023-09-27": "Milad-i-Sherif",
  "2023-10-02": "Gandhi Jayanthi",
  "2023-10-23": "Mahanavami",
  "2023-10-24": "Vijayadashami",
  "2023-11-12": "Deepavali",
  "2023-12-25": "Christmas",

  // 2024
  "2024-01-02": "Mannam Jayanthi",
  "2024-01-26": "Republic Day",
  "2024-03-08": "Maha Shivaratri",
  "2024-03-28": "Maundy Thursday",
  "2024-03-29": "Good Friday",
  "2024-04-10": "Id-ul-Fitr (Ramzan)",
  "2024-04-11": "Id-ul-Fitr (Ramzan)",
  "2024-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2024-05-01": "May Day",
  "2024-06-17": "Bakrid (Id-ul-Adha)",
  "2024-07-16": "Muharram",
  "2024-08-15": "Independence Day",
  "2024-08-20": "Sree Narayana Guru Jayanthi",
  "2024-08-28": "Ayyankali Jayanthi",
  "2024-09-14": "First Onam",
  "2024-09-15": "Thiruvonam",
  "2024-09-16": "Third Onam / Milad-i-Sherif",
  "2024-09-17": "Fourth Onam",
  "2024-09-21": "Sree Narayana Guru Samadhi",
  "2024-10-02": "Gandhi Jayanthi",
  "2024-10-11": "Mahanavami",
  "2024-10-12": "Vijayadashami",
  "2024-10-31": "Deepavali",
  "2024-12-25": "Christmas",

  // 2025
  "2025-01-02": "Mannam Jayanthi",
  "2025-01-26": "Republic Day",
  "2025-02-26": "Maha Shivaratri",
  "2025-03-31": "Id-ul-Fitr (Ramzan)",
  "2025-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2025-04-17": "Maundy Thursday",
  "2025-04-18": "Good Friday",
  "2025-05-01": "May Day",
  "2025-06-06": "Bakrid (Id-ul-Adha)",
  "2025-06-07": "Bakrid (Id-ul-Adha)",
  "2025-07-06": "Muharram",
  "2025-08-15": "Independence Day",
  "2025-08-28": "Ayyankali Jayanthi",
  "2025-09-04": "First Onam",
  "2025-09-05": "Thiruvonam / Milad-i-Sherif",
  "2025-09-06": "Third Onam",
  "2025-09-07": "Fourth Onam",
  "2025-09-08": "Sree Narayana Guru Jayanthi",
  "2025-09-21": "Sree Narayana Guru Samadhi",
  "2025-10-01": "Mahanavami",
  "2025-10-02": "Vijayadashami / Gandhi Jayanthi",
  "2025-10-20": "Deepavali",
  "2025-12-25": "Christmas",

  // 2026
  "2026-01-02": "Mannam Jayanthi",
  "2026-01-26": "Republic Day",
  "2026-02-15": "Maha Shivaratri",
  "2026-03-20": "Id-ul-Fitr (Ramzan)",
  "2026-04-02": "Maundy Thursday",
  "2026-04-03": "Good Friday",
  "2026-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2026-05-01": "May Day",
  "2026-05-27": "Bakrid (Id-ul-Adha)",
  "2026-06-25": "Muharram",
  "2026-08-15": "Independence Day",
  "2026-08-25": "Milad-i-Sherif",
  "2026-08-26": "First Onam",
  "2026-08-27": "Thiruvonam",
  "2026-08-28": "Third Onam / Sree Narayana Guru Jayanthi / Ayyankali Jayanthi",
  "2026-08-29": "Fourth Onam",
  "2026-09-21": "Sree Narayana Guru Samadhi",
  "2026-10-02": "Gandhi Jayanthi",
  "2026-10-19": "Mahanavami",
  "2026-10-20": "Vijayadashami",
  "2026-11-08": "Deepavali",
  "2026-12-25": "Christmas",

  // 2027
  "2027-01-02": "Mannam Jayanthi",
  "2027-01-26": "Republic Day",
  "2027-03-06": "Maha Shivaratri",
  "2027-03-10": "Id-ul-Fitr (Ramzan)",
  "2027-03-25": "Maundy Thursday",
  "2027-03-26": "Good Friday",
  "2027-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2027-05-01": "May Day",
  "2027-05-17": "Bakrid (Id-ul-Adha)",
  "2027-06-15": "Muharram",
  "2027-08-14": "Milad-i-Sherif",
  "2027-08-15": "Independence Day",
  "2027-08-28": "Ayyankali Jayanthi",
  "2027-09-12": "First Onam",
  "2027-09-13": "Thiruvonam",
  "2027-09-14": "Third Onam",
  "2027-09-15": "Fourth Onam",
  "2027-09-16": "Sree Narayana Guru Jayanthi",
  "2027-09-21": "Sree Narayana Guru Samadhi",
  "2027-10-02": "Gandhi Jayanthi",
  "2027-10-09": "Mahanavami",
  "2027-10-10": "Vijayadashami",
  "2027-10-29": "Deepavali",
  "2027-12-25": "Christmas",

  // 2028
  "2028-01-02": "Mannam Jayanthi",
  "2028-01-26": "Republic Day",
  "2028-02-24": "Maha Shivaratri",
  "2028-02-27": "Id-ul-Fitr (Ramzan)",
  "2028-04-13": "Maundy Thursday",
  "2028-04-14": "Good Friday / Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2028-05-01": "May Day",
  "2028-05-05": "Bakrid (Id-ul-Adha)",
  "2028-06-03": "Muharram",
  "2028-08-02": "Milad-i-Sherif",
  "2028-08-15": "Independence Day",
  "2028-08-28": "Ayyankali Jayanthi",
  "2028-09-01": "First Onam",
  "2028-09-02": "Thiruvonam",
  "2028-09-03": "Third Onam",
  "2028-09-04": "Sree Narayana Guru Jayanthi",
  "2028-09-21": "Sree Narayana Guru Samadhi",
  "2028-09-27": "Mahanavami",
  "2028-09-28": "Vijayadashami",
  "2028-10-02": "Gandhi Jayanthi",
  "2028-10-17": "Deepavali",
  "2028-12-25": "Christmas",

  // 2029
  "2029-01-02": "Mannam Jayanthi",
  "2029-01-26": "Republic Day",
  "2029-02-13": "Maha Shivaratri",
  "2029-03-16": "Id-ul-Fitr (Ramzan)",
  "2029-03-29": "Maundy Thursday",
  "2029-03-30": "Good Friday",
  "2029-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2029-05-01": "May Day",
  "2029-05-24": "Bakrid (Id-ul-Adha)",
  "2029-06-23": "Muharram",
  "2029-07-23": "Milad-i-Sherif",
  "2029-08-15": "Independence Day",
  "2029-08-21": "First Onam",
  "2029-08-22": "Thiruvonam",
  "2029-08-23": "Third Onam",
  "2029-08-28": "Ayyankali Jayanthi",
  "2029-09-21": "Sree Narayana Guru Samadhi",
  "2029-10-02": "Gandhi Jayanthi",
  "2029-10-16": "Mahanavami",
  "2029-10-17": "Vijayadashami",
  "2029-11-05": "Deepavali",
  "2029-12-25": "Christmas",

  // 2030
  "2030-01-02": "Mannam Jayanthi",
  "2030-01-26": "Republic Day",
  "2030-03-03": "Maha Shivaratri",
  "2030-03-06": "Id-ul-Fitr (Ramzan)",
  "2030-04-14": "Vishu / Dr. B.R. Ambedkar Jayanthi",
  "2030-04-18": "Maundy Thursday",
  "2030-04-19": "Good Friday",
  "2030-05-01": "May Day",
  "2030-05-14": "Bakrid (Id-ul-Adha)",
  "2030-06-12": "Muharram",
  "2030-07-12": "Milad-i-Sherif",
  "2030-08-10": "First Onam",
  "2030-08-11": "Thiruvonam",
  "2030-08-12": "Third Onam",
  "2030-08-15": "Independence Day",
  "2030-08-28": "Ayyankali Jayanthi",
  "2030-09-21": "Sree Narayana Guru Samadhi",
  "2030-10-02": "Gandhi Jayanthi",
  "2030-10-05": "Mahanavami",
  "2030-10-06": "Vijayadashami",
  "2030-10-26": "Deepavali",
  "2030-12-25": "Christmas",
};

/**
 * Safely parses any date input (string, Date, Firestore Timestamp) to a local midnight Date.
 */
export function parseDateOnly(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  }
  if (typeof val?.toDate === "function") {
    const d = val.toDate();
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      return new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10)
      );
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }
  return null;
}

/**
 * Formats a Date object as YYYY-MM-DD string.
 */
export function formatDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the day is Sunday.
 */
export function isSunday(d: Date): boolean {
  return d.getDay() === 0;
}

/**
 * Checks whether a given Date is a Public Holiday.
 */
export function isPublicHoliday(d: Date): boolean {
  const ymd = formatDateOnly(d);
  if (KERALA_GAZETTED_HOLIDAYS[ymd]) {
    return true;
  }
  const mmdd = ymd.slice(5); // "MM-DD"
  if (KERALA_FIXED_PUBLIC_HOLIDAYS.some((h) => h.mmdd === mmdd)) {
    return true;
  }
  return false;
}

/**
 * Returns the holiday name if it is a public holiday, or null.
 */
export function getPublicHolidayName(d: Date): string | null {
  const ymd = formatDateOnly(d);
  if (KERALA_GAZETTED_HOLIDAYS[ymd]) {
    return KERALA_GAZETTED_HOLIDAYS[ymd];
  }
  const mmdd = ymd.slice(5);
  const fixed = KERALA_FIXED_PUBLIC_HOLIDAYS.find((h) => h.mmdd === mmdd);
  return fixed ? fixed.name : null;
}

/**
 * Returns true if the day is a Sunday OR a Public Holiday.
 */
export function isNonWorkingDay(d: Date): boolean {
  return isSunday(d) || isPublicHoliday(d);
}

/**
 * Calculates the official work commencement date after a Work Order is issued:
 * 1. Takes Work Order Date
 * 2. Adds 4 calendar days (mobilization period)
 * 3. If the resulting date falls on a Sunday or Public Holiday, rolls forward to the next working day.
 * Returns formatted YYYY-MM-DD string or null.
 */
export function calculateWorkCommencementDate(
  workOrderDateInput: string | Date | any,
  daysOffset: number = 4
): string | null {
  const baseDate = parseDateOnly(workOrderDateInput);
  if (!baseDate) return null;

  // Add 4 calendar days
  const targetDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + daysOffset
  );

  // If Sunday or Public Holiday, advance until the next working day
  while (isNonWorkingDay(targetDate)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  return formatDateOnly(targetDate);
}
