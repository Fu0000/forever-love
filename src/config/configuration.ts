const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export default () => ({
  port: toNumber(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'replace-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  defaultAvatarUrl:
    process.env.DEFAULT_AVATAR_URL ??
    'https://api.dicebear.com/9.x/fun-emoji/svg?seed=CoupleApp',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? '127.0.0.1',
    port: toNumber(process.env.MINIO_PORT, 9000),
    useSSL: toBoolean(process.env.MINIO_USE_SSL, false),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'couple-media',
    publicUrl: process.env.MINIO_PUBLIC_URL ?? '',
    uploadExpirySeconds: toNumber(process.env.MINIO_UPLOAD_EXPIRY_SECONDS, 900),
  },
});
