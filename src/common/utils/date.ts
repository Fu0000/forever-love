export const toDateOnlyString = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
};
