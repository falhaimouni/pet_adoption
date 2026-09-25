import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileUploadCategory } from '@shared/enums';
import { UploadsService } from '../../src/modules/uploads/uploads.service';
import { FileUpload } from '../../src/database/entities/file-upload.entity';

const admin = { userId: 'admin', role: 'ADMIN' } as any;
test('stored image/PDF workflow: validate, list safe metadata, retrieve, reject access, delete', async () => {
  const previous = process.cwd();
  const root = await mkdtemp(join(tmpdir(), 'petopia-files-'));
  try {
    process.chdir(root);
    await mkdir(join(root, 'uploads', 'pets'), { recursive: true });
    await mkdir(join(root, 'uploads', 'documents'), { recursive: true });
    const records = new Map<string, FileUpload>();
    const repo: any = {
      create: (file: FileUpload) => file,
      save: async (file: FileUpload) => {
        file.uploadedAt = new Date();
        file.uploadedByUser = { firstName: 'Test', lastName: 'Admin', password: 'NEVER EXPOSE' } as any;
        records.set(file.fileId, file); return file;
      },
      find: async () => [...records.values()],
      findOne: async ({ where }: any) => records.get(where.fileId) ?? null,
      delete: async (id: string) => records.delete(id),
    };
    const manager = { getRepository: (entity: any) => entity === FileUpload ? repo : { delete: async () => {} } };
    repo.manager = manager;
    const service = new UploadsService(repo, { transaction: async (fn: any) => fn(manager) } as any);
    for (const [category, folder, name, mime, contents] of [
      [FileUploadCategory.PET_IMAGE, 'pets', 'pet.png', 'image/png', Buffer.from([137,80,78,71,13,10,26,10])],
      [FileUploadCategory.DOCUMENT, 'documents', 'record.pdf', 'application/pdf', Buffer.from('%PDF-1.4\n%%EOF')],
    ] as const) {
      const path = join(root, 'uploads', folder, name);
      await writeFile(path, contents);
      const stored = await service.createFileRecord({ path, filename: name, originalname: name, mimetype: mime, size: contents.length } as any, category, 'admin');
      const list = await service.listFiles(admin);
      assert.equal(list.length, 1);
      assert.equal(list[0].fileUrl, `/files/${stored.fileId}`);
      assert.equal(list[0].uploadedByName, 'Test Admin');
      assert.equal(list[0].canDelete, true);
      assert.ok(!JSON.stringify(list).includes('NEVER EXPOSE'));
      assert.ok(!('uploadedByUser' in list[0]));
      assert.equal((await service.getFileForUser(stored.fileId, admin)).filePath, path);
      for (const role of ['ADOPTER', 'EMPLOYEE', 'VET', 'MANAGER']) {
        await assert.rejects(service.listFiles({ ...admin, role }), ForbiddenException);
      }
      if (category === FileUploadCategory.DOCUMENT) {
        await assert.rejects(service.getFileForUser(stored.fileId, { ...admin, role: 'ADOPTER' }), ForbiddenException);
      }
      await assert.rejects(service.deleteFile(stored.fileId, { ...admin, role: 'ADOPTER' }), ForbiddenException);
      await access(path);
      await service.deleteFile(stored.fileId, admin);
      assert.deepEqual(await service.listFiles(admin), []);
      await assert.rejects(access(path));
      await assert.rejects(service.getFileForUser(stored.fileId, admin), NotFoundException);
    }
    const invalid = join(root, 'uploads', 'pets', 'fake.png');
    await writeFile(invalid, 'not a png');
    await assert.rejects(service.createFileRecord({ path: invalid, filename: 'fake.png', originalname: 'fake.png', mimetype: 'image/png', size: 9 } as any, FileUploadCategory.PET_IMAGE, 'admin'), /does not match/);
    await assert.rejects(access(invalid));
    assert.equal(records.size, 0);
  } finally { process.chdir(previous); await rm(root, { recursive: true, force: true }); }
});
