// Shift / attendance time helpers.
//
// The backend serialises timestamps such as `CheckIn` as LOCAL wall-clock time
// (e.g. IST) with a bogus trailing `Z`, not real UTC. For example a check-in at
// 7:57 PM IST arrives as "2026-08-05T19:57:59.677Z" even though the matching
// server `CreatedOn` (real UTC) reads "2026-08-05T14:27:59.677Z" — exactly 5:30
// earlier. Using `new Date(str)` on such a value shifts it by the timezone offset
// and can even flip the calendar date. The rest of the app already sidesteps this
// by reading only the wall-clock digits (see `parseTimeToDate`), so we do the same
// here: parse the components literally as local time.

/** Parse a backend timestamp as LOCAL wall-clock time, ignoring any trailing `Z`. */
export const parseBackendLocal = (s: any): Date => {
  if (s instanceof Date) return new Date(s);
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  return m
    ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0)
    : new Date(s);
};

/**
 * Decide whether checking out `now` counts as an early checkout.
 *
 * @param shiftEndParsed The scheduled end time-of-day (from `parseTimeToDate`,
 *   anchored to today). Pass `null` when no schedule is available.
 * @param checkIn        The active record's `CheckIn` (backend timestamp) or falsy.
 * @param now            The current time.
 *
 * Anchors the scheduled end to the check-in's calendar date, then rolls it forward
 * to the first end strictly after the check-in. This derives the correct end for
 * same-day, overnight, extended, early-arrival and late/post-midnight check-ins
 * without any overnight special-casing.
 */
export const isEarlyCheckout = (
  shiftEndParsed: Date | null,
  checkIn: any,
  now: Date
): boolean => {
  if (!shiftEndParsed) return false;
  if (!checkIn) return now < shiftEndParsed;
  const shiftEnd = new Date(shiftEndParsed);
  const anchor = checkIn ? parseBackendLocal(checkIn) : now;
  shiftEnd.setFullYear(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  while (shiftEnd <= anchor) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }
  return now < shiftEnd;
};
