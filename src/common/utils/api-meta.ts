export const withMeta = <T>(
  data: T,
  meta: Record<string, unknown>,
): { data: T; __meta: Record<string, unknown> } => ({
  data,
  __meta: meta,
});
