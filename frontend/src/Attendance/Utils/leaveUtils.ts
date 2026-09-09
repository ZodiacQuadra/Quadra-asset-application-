/** Display-only label mapper — does NOT affect submitted values or DB data */
export const displayLeaveLabel = (name: string | null | undefined): string => {
  if (!name) return "";
  return /maternity/i.test(name) ? "Parental Leave" : name;
};
