import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, ForbiddenException, ValidationPipe } from '@nestjs/common';
import { BulkDeleteDocumentsDto } from '@shared/dto/bulk-documents.dto';
import { FileUploadCategory } from '@shared/enums';
import { MedicalService } from '../../src/modules/medical/medical.service';
import { UploadsService } from '../../src/modules/uploads/uploads.service';

test('bulk PDF import continues after a rejected PDF and preserves row errors', async () => {
  const cleaned: string[] = [];
  const service = new MedicalService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any,
    { rollbackFileUpload: async (path: string) => { cleaned.push(path); } } as any);
  const seen: string[] = [];
  service.importMedicalData = async (petId, userId, file) => {
    assert.equal(petId, 'pet'); assert.equal(userId, 'vet');
    seen.push(file.path);
    if (file.path === 'bad') throw new BadRequestException('Invalid PDF');
    return { success: file.path !== 'partial', imported: 1, failed: file.path === 'partial' ? 1 : 0,
      errors: file.path === 'partial' ? [{ row: 2, message: 'Invalid date' }] : [],
      created: { entries: [], vaccinations: [] }, fileId: file.path };
  };
  const files = ['bad', 'partial', 'good'].map((path) => ({ path, originalname: 'medical.pdf' } as Express.Multer.File));
  const result = await service.importMedicalDocuments('pet', 'vet', files);
  assert.deepEqual(seen, ['bad', 'partial', 'good']);
  assert.deepEqual(cleaned, ['bad']);
  assert.equal(result.imported, 2);
  assert.equal(result.failed, 1);
  assert.equal(result.partial, 1);
  assert.equal(result.importedRows, 2);
  assert.equal(result.results[1].summary?.errors[0].row, 2);
  assert.equal(result.results[0].statusCode, 400);
  await assert.rejects(() => service.importMedicalDocuments('pet', 'vet', []), BadRequestException);
  await assert.rejects(() => service.importMedicalDocuments('pet', 'vet', Array(21).fill(files[0])), BadRequestException);
});

test('bulk delete rejects non-documents, reports missing files, and restores files on database failure', async () => {
  const removed: string[] = []; const restored: string[] = []; const deleted: string[] = [];
  const repo = { findOne: async ({ where }: any) => where.fileId === 'missing' ? null : ({
    fileId: where.fileId, mimeType: 'application/pdf',
    category: where.fileId === 'image' ? FileUploadCategory.PET_IMAGE : FileUploadCategory.DOCUMENT,
  }) };
  const manager = { getRepository: () => ({ delete: async (id: string) => {
    if (id === 'broken') throw new Error('private database details');
    deleted.push(id);
  } }) };
  const service = new UploadsService(repo as any, { transaction: async (fn: any) => fn(manager) } as any);
  service.removePhysicalFile = async (file) => { removed.push(file.fileId);
    return { fileId: file.fileId, filePath: file.fileId, contents: Buffer.from('pdf') }; };
  service.restorePhysicalFile = async (backup) => { restored.push(backup.fileId); };
  const user = { userId: 'vet', role: 'VET' } as any;
  const result = await service.deleteDocuments(['image', 'missing', 'broken', 'good'], user);
  assert.equal(result.deleted, 1); assert.equal(result.failed, 3);
  assert.deepEqual(removed, ['broken', 'good']);
  assert.deepEqual(restored, ['broken']); assert.deepEqual(deleted, ['good']);
  assert.equal(result.results[2].error, 'Unable to delete document.');
  await assert.rejects(() => service.deleteDocuments(['good'], { ...user, role: 'ADOPTER' }), ForbiddenException);
  await assert.rejects(() => service.deleteDocuments(['good', 'good'], user), BadRequestException);
  await assert.rejects(() => service.deleteDocuments([], user), BadRequestException);
});

test('bulk deletion request validation rejects invalid UUIDs, duplicate IDs, and oversized batches', async () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const metadata = { type: 'body' as const, metatype: BulkDeleteDocumentsDto };
  const id = '11111111-1111-4111-8111-111111111111';
  for (const body of [{}, { fileIds: [] }, { fileIds: ['invalid'] }, { fileIds: [id, id] }, { fileIds: Array(21).fill(id) }]) {
    await assert.rejects(() => pipe.transform(body, metadata), BadRequestException);
  }
  const dto = await pipe.transform({ fileIds: [id] }, metadata);
  assert.deepEqual(dto.fileIds, [id]);
});
