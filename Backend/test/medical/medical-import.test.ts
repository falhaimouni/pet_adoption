import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { FileUploadCategory } from '@shared/enums';
import { MedicalService } from '../../src/modules/medical/medical.service';
import { validateUploadedFile } from '../../src/modules/uploads/upload-validation.util';

function buildService(overrides: Partial<Record<string, any>> = {}) {
  const petRepo = {
    findOne: async () => ({ petId: '11111111-1111-1111-1111-111111111111' }),
    ...overrides.petRepo,
  };

  const userRepo = {
    findOne: async () => ({ userId: '22222222-2222-2222-2222-222222222222', firstName: 'Test', lastName: 'Vet' }),
    ...overrides.userRepo,
  };

  const medicalRecordRepo = {
    findOne: async () => null,
    save: async (value: any) => ({ ...value, recordId: 'record-1' }),
    create: (value: any) => value,
    delete: async () => undefined,
    ...overrides.medicalRecordRepo,
  };

  const medicalEntryRepo = {
    create: (value: any) => value,
    save: async (value: any) => Array.isArray(value)
      ? value.map((entry) => ({ ...entry, entryId: `entry-${Math.random().toString(16).slice(2)}` }))
      : ({ ...value, entryId: `entry-${Math.random().toString(16).slice(2)}` }),
    delete: async () => undefined,
    ...overrides.medicalEntryRepo,
  };

  const vaccinationRepo = {
    create: (value: any) => value,
    save: async (value: any) => Array.isArray(value)
      ? value.map((vaccination) => ({ ...vaccination, vaccinationId: `vacc-${Math.random().toString(16).slice(2)}` }))
      : ({ ...value, vaccinationId: `vacc-${Math.random().toString(16).slice(2)}` }),
    delete: async () => undefined,
    ...overrides.vaccinationRepo,
  };

  const activityLogRepo = {
    create: (value: any) => value,
    save: async (value: any) => value,
    ...overrides.activityLogRepo,
  };

  const uploadsService = {
    createFileRecord: async () => ({ fileId: 'file-1' }),
    rollbackFileUpload: async () => undefined,
    ...overrides.uploadsService,
  };

  const dataSource = {
    transaction: async (fn: any) => fn({
      getRepository: (entity: any) => {
        if (entity.name === 'MedicalRecord') return medicalRecordRepo;
        if (entity.name === 'MedicalEntry') return medicalEntryRepo;
        if (entity.name === 'Vaccination') return vaccinationRepo;
        return { save: async (value: any) => value, create: (value: any) => value };
      },
    }),
    ...overrides.dataSource,
  };

  return new MedicalService(
    medicalRecordRepo,
    medicalEntryRepo,
    vaccinationRepo,
    petRepo,
    userRepo,
    activityLogRepo,
    uploadsService,
    dataSource,
  );
}

function makeFile(contents: string, name: string, mimeType: string) {
  const dir = mkdtempSync(join(tmpdir(), 'medical-import-'));
  const path = join(dir, name);
  writeFileSync(path, contents, 'utf8');

  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: mimeType,
    size: Buffer.byteLength(contents),
    destination: dir,
    filename: name,
    path,
    buffer: Buffer.from(contents, 'utf8'),
  } as Express.Multer.File;
}

async function makePdfFile(lines: string[]) {
  const document = new PDFDocument();
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
  });

  document.text(lines.join('\n'));
  document.end();
  const contents = await completed;
  const dir = mkdtempSync(join(tmpdir(), 'medical-import-pdf-'));
  const path = join(dir, 'medical.pdf');
  writeFileSync(path, contents);

  return {
    fieldname: 'file',
    originalname: 'medical.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: contents.length,
    destination: dir,
    filename: 'medical.pdf',
    path,
    buffer: contents,
  } as Express.Multer.File;
}

test('valid PDF import creates medical entry and vaccination records', async () => {
  const service = buildService();
  const file = await makePdfFile([
    'Diagnosis: Mild ear infection',
    'Treatment: Amoxicillin 5 days',
    'Vaccination Status: VACCINATED',
    'Medical Date: 2026-09-20',
    'Vaccine Name: Rabies',
    'Vaccination Date: 2026-09-20',
    'Next Due Date: 2027-09-20',
    'Notes: Follow-up in 1 week',
  ]);

  const result = await service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file);

  assert.equal(result.success, true);
  assert.equal(result.imported, 1);
  assert.equal(result.failed, 0);
  assert.equal(result.errors.length, 0);
});

test('PDF import creates a medical record from extracted fields', async () => {
  const service = buildService();
  const file = await makePdfFile([
    'Diagnosis: Weight loss',
    'Treatment: Monitor diet',
    'Vaccination Status: VACCINATED',
    'Medical Date: 2026-09-15',
  ]);

  const result = await service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file);

  assert.equal(result.success, true);
  assert.equal(result.imported, 1);
  assert.equal(result.failed, 0);
});

test('one PDF imports multiple labeled medical records as one batch', async () => {
  const savedBatches: any[][] = [];
  const service = buildService({
    medicalEntryRepo: {
      create: (value: any) => value,
      save: async (value: any) => {
        savedBatches.push(value);
        return value.map((entry: any, index: number) => ({ ...entry, entryId: `entry-${index + 1}` }));
      },
    },
  });
  const file = await makePdfFile([
    'Record 1',
    'Diagnosis: Ear infection',
    'Treatment: Antibiotics',
    'Medical Date: 2026-09-20',
    'Record 2',
    'Diagnosis: Weight loss',
    'Treatment: Monitor diet',
    'Medical Date: 2026-09-21',
  ]);

  const result = await service.importMedicalData(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    file,
  );

  assert.equal(result.imported, 2);
  assert.equal(result.failed, 0);
  assert.equal(savedBatches.length, 1);
  assert.equal(savedBatches[0]?.length, 2);
});

test('rejects invalid file type during validation', async () => {
  const file = makeFile('hello world', 'bad.exe', 'application/octet-stream');

  await assert.rejects(
    () => validateUploadedFile(file, 'DOCUMENT' as any),
    (error: any) => {
      assert.equal(error instanceof BadRequestException, true);
      return true;
    },
  );
});

test('rejects JSON and CSV as medical import sources', async () => {
  for (const [name, mimeType] of [['medical.json', 'application/json'], ['medical.csv', 'text/csv']] as const) {
    await assert.rejects(
      () => validateUploadedFile(makeFile('{}', name, mimeType), FileUploadCategory.DOCUMENT),
      BadRequestException,
    );
  }
});

test('malformed PDF returns a clear validation error', async () => {
  const service = buildService();
  const file = makeFile('%PDF-not-a-real-pdf', 'medical.pdf', 'application/pdf');

  await assert.rejects(
    () => service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file),
    (error: any) => {
      assert.equal(error instanceof BadRequestException, true);
      assert.match(String(error.message), /PDF|malformed|parse/i);
      return true;
    },
  );
});

test('nonexistent pet is rejected before creating records', async () => {
  const service = buildService({
    petRepo: {
      findOne: async () => null,
    },
  });

  await assert.rejects(
    () => service.importMedicalData('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', makeFile('%PDF-1.4', 'medical.pdf', 'application/pdf')),
    (error: any) => {
      assert.equal(error instanceof NotFoundException, true);
      return true;
    },
  );
});

test('invalid extracted PDF data is rejected without importing a row', async () => {
  const service = buildService();
  const file = await makePdfFile([
    'Diagnosis: ',
    'Treatment: Bad row',
    'Medical Date: invalid-date',
  ]);

  await assert.rejects(
    () => service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file),
    BadRequestException,
  );
});

test('database transaction failure cleans the uploaded file immediately', async () => {
  const rollbackCalls: Array<{ path: string; fileId?: string }> = [];
  const service = buildService({
    dataSource: {
      transaction: async () => {
        throw new Error('transaction failed');
      },
    },
    uploadsService: {
      createFileRecord: async () => ({ fileId: 'file-1' }),
      rollbackFileUpload: async (path: string, fileId?: string) => {
        rollbackCalls.push({ path, fileId });
      },
    },
  });

  const file = await makePdfFile([
    'Diagnosis: Bad import',
    'Treatment: retry',
    'Medical Date: 2026-09-20',
  ]);

  await assert.rejects(
    () => service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file),
    /transaction failed/i,
  );

  assert.equal(rollbackCalls.some((call) => call.path === file.path), true);
});

test('failed file-record creation rolls back medical data and removes the physical file', async () => {
  const rollbackCalls: Array<{ path: string; fileId?: string }> = [];
  const deleted: { records: string[]; entries: string[]; vaccinations: string[] } = {
    records: [],
    entries: [],
    vaccinations: [],
  };

  const service = buildService({
    medicalRecordRepo: {
      findOne: async () => null,
      save: async (value: any) => ({ ...value, recordId: 'record-1' }),
      create: (value: any) => value,
      delete: async (id: string) => {
        deleted.records.push(id);
      },
    },
    medicalEntryRepo: {
      create: (value: any) => value,
      save: async (value: any) => Array.isArray(value)
        ? value.map((entry) => ({ ...entry, entryId: 'entry-1' }))
        : ({ ...value, entryId: 'entry-1' }),
      delete: async (ids: string[]) => {
        deleted.entries.push(...ids);
      },
    },
    vaccinationRepo: {
      create: (value: any) => value,
      save: async (value: any) => Array.isArray(value)
        ? value.map((vaccination) => ({ ...vaccination, vaccinationId: 'vacc-1' }))
        : ({ ...value, vaccinationId: 'vacc-1' }),
      delete: async (ids: string[]) => {
        deleted.vaccinations.push(...ids);
      },
    },
    uploadsService: {
      createFileRecord: async () => {
        throw new Error('file record failed');
      },
      rollbackFileUpload: async (path: string, fileId?: string) => {
        rollbackCalls.push({ path, fileId });
      },
    },
  });

  const file = await makePdfFile([
    'Diagnosis: Valid diagnosis',
    'Treatment: Treatment plan',
    'Vaccination Status: VACCINATED',
    'Medical Date: 2026-09-20',
    'Vaccine Name: Rabies',
    'Vaccination Date: 2026-09-20',
  ]);

  await assert.rejects(
    () => service.importMedicalData('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', file),
    /file record failed/i,
  );

  assert.deepEqual(deleted.records, ['record-1']);
  assert.deepEqual(deleted.entries, ['entry-1']);
  assert.deepEqual(deleted.vaccinations, ['vacc-1']);
  assert.equal(rollbackCalls.some((call) => call.path === file.path), true);
});

process.on('exit', () => {
  // ensure temp directories do not linger in the test process
});
