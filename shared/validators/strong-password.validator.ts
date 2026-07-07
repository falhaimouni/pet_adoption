import { Matches } from 'class-validator';

const STRONG_PASSWORD_MESSAGE =
  'password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol';

export function StrongPassword() {
  return Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: STRONG_PASSWORD_MESSAGE,
  });
}
