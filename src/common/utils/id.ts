import { randomBytes, randomInt } from 'crypto';

const pairCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateEntityId = (prefix: string): string => {
  const suffix = randomBytes(16).toString('hex').slice(0, 20);
  return `${prefix}${suffix}`;
};

export const generatePairCode = (): string => {
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += pairCodeAlphabet[randomInt(0, pairCodeAlphabet.length)];
  }
  return code;
};
