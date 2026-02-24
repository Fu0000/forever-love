type CursorPayload = {
  createdAt: string;
  id: string;
};

export const encodeCursor = (value: CursorPayload): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

export const decodeCursor = (value?: string): CursorPayload | null => {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as CursorPayload;
    if (!parsed.createdAt || !parsed.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
