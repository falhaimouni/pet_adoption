//check if file or folder exists
import { existsSync } from 'fs';
import { join } from 'path';
import { UPLOAD_ROOT } from '@shared/constants/uploads.constants';

export function resolveUploadRoot(): string {
  const candidates = [
    join(process.cwd(), UPLOAD_ROOT),
    join(process.cwd(), 'Backend', UPLOAD_ROOT),
  ];

  //check existance, if not return the first candidate
  return (
    candidates.find((candidate) => existsSync(candidate)) ??
    candidates[0]
  );
}