import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { PDFParse } from 'pdf-parse';
import { DataSource, QueryFailedError, Repository } from 'typeorm';

import {
  CreateMedicalEntryDto,
  UpdateMedicalEntryDto,
  MedicalImportRowDto,
} from '@shared/dto';
import { FileUploadCategory } from '@shared/enums';
import { MedicalEntry } from '../../database/entities/medical-entry.entity';
import { MedicalRecord } from '../../database/entities/medical-record.entity';
import { Pet } from '../../database/entities/pet.entity';
import { User } from '../../database/entities/user.entity';
import { Vaccination } from '../../database/entities/vaccination.entity';
import { ActivityLog } from '../../database/entities/activity-log.entity';
import { NotificationTypeEnum, RolesEnum } from '@shared/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { FileUpload } from '../../database/entities/file-upload.entity';
import { UploadsService } from '../uploads/uploads.service';
import { validateUploadedFile } from '../uploads/upload-validation.util';

import { MAX_BULK_DOCUMENTS } from '@shared/dto/bulk-documents.dto';

interface MedicalVeterinarianResponse {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface MedicalEntryResponse {
  entryId: string;
  recordId: string;
  diagnosis: string;
  treatment: string;
  vaccinationStatus: string;
  medicalDate: string;
  notes?: string | null;
  createdAt: Date;
  veterinarian: MedicalVeterinarianResponse;
}

interface MedicalRecordResponse {
  recordId: string;
  petId: string;
  createdAt: Date;
  pet: {
    petId: string;
    name: string;
    species: string;
    breed?: string | null;
    age?: number | null;
    gender?: string | null;
    healthStatus?: string | null;
    adoptionStatus: string;
  };
  entries: MedicalEntryResponse[];
  documents: FileUpload[];
}

export interface MedicalImportValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface MedicalImportSummary {
  success: boolean;
  /** Number of input rows that passed validation and were processed. */
  imported: number;
  /** Number of input rows rejected because they had one or more validation errors. */
  failed: number;
  errors: MedicalImportValidationError[];
  recordId?: string;
  fileId?: string;
  created: {
    entries: Partial<MedicalEntry>[];
    vaccinations: Partial<Vaccination>[];
  };
}

@Injectable()
export class MedicalService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepo: Repository<MedicalRecord>,

    @InjectRepository(MedicalEntry)
    private readonly medicalEntryRepo: Repository<MedicalEntry>,

    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,

    @InjectRepository(Pet)
    private readonly petRepo: Repository<Pet>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,

    private readonly uploadsService: UploadsService,

    @InjectDataSource()
    private readonly dataSource?: DataSource,

    private readonly notificationsService?: NotificationsService,
  ) {}

  async importMedicalDocuments(
    petId: string,
    veterinarianId: string,
    files: Express.Multer.File[] = [],
  ) {
    if (files.length === 0 || files.length > MAX_BULK_DOCUMENTS) {
      await Promise.all(files.map((file) => this.uploadsService.rollbackFileUpload(file.path)));
      throw new BadRequestException('Provide between 1 and 20 PDF documents.');
    }

    const results: Array<{
      index: number; fileName: string; success: boolean;
      summary?: MedicalImportSummary; statusCode?: number; error?: string | object;
    }> = [];
    for (const [index, file] of files.entries()) {
      try {
        const summary = await this.importMedicalData(petId, veterinarianId, file);
        results.push({ index, fileName: file.originalname, success: summary.success, summary });
      } catch (error) {
        await this.uploadsService.rollbackFileUpload(file.path);
        results.push({
          index, fileName: file.originalname, success: false,
          statusCode: error instanceof HttpException ? error.getStatus() : 500,
          error: error instanceof HttpException ? error.getResponse() : 'Unable to import document.',
        });
      }
    }
    const imported = results.filter((result) => result.summary !== undefined).length;
    const failed = files.length - imported;
    const partial = results.filter((result) => result.summary && !result.success).length;
    return {
      total: files.length, imported, failed, partial,
      importedRows: results.reduce((count, result) => count + (result.summary?.imported ?? 0), 0),
      results,
    };
  }

  async uploadMedicalDocument(
    petId: string,
    veterinarianId: string,
    file: Express.Multer.File,
  ): Promise<FileUpload> {
    let record: MedicalRecord;
    let created = false;

    try {
      const result = await this.findOrCreateRecord(petId);
      record = result.record;
      created = result.created;
    } catch (error) {
      await this.uploadsService.rollbackFileUpload(file.path);
      throw error;
    }

    if (created) {
      await this.activityLogRepo.save(
        this.activityLogRepo.create({
          userId: veterinarianId,
          action: 'MEDICAL_RECORD_CREATED',
          entityType: 'MEDICAL_RECORD',
          entityId: record.recordId,
        }),
      );
    }

    return this.uploadsService.createFileRecord(
      file,
      FileUploadCategory.DOCUMENT,
      veterinarianId,
      record.recordId,
    );
  }

  async importMedicalData(
    petId: string,
    veterinarianId: string,
    file: Express.Multer.File,
  ): Promise<MedicalImportSummary> {
    let rows: Record<string, any>[];
    try {
      await validateUploadedFile(file, FileUploadCategory.DOCUMENT);
      await this.ensurePetExists(petId);
      rows = await this.parseImportFile(file);
    } catch (error) {
      await this.uploadsService.rollbackFileUpload(file.path);
      throw error;
    }

    const validRows: Array<{ rowNumber: number; row: Record<string, any> }> = [];
    const errors: MedicalImportValidationError[] = [];
    let failedRows = 0;

    for (const [index, row] of rows.entries()) {
      const result = await this.validateImportRow(
        row,
        petId,
        veterinarianId,
        index + 1,
      );

      if (result.valid) {
        validRows.push({ rowNumber: result.rowNumber, row: result.row });
      } else {
        failedRows += 1;
      }
      errors.push(...result.errors);
    }

    if (validRows.length === 0) {
      await this.uploadsService.rollbackFileUpload(file.path);
      throw new BadRequestException({
        message: 'No valid medical records were found in the import file.',
        errors,
      });
    }

    let createdRecordId: string | null = null;
    let createdMedicalRecord = false;
    const createdEntryIds: string[] = [];
    const createdVaccinationIds: string[] = [];
    const createdEntries: Partial<MedicalEntry>[] = [];
    const createdVaccinations: Partial<Vaccination>[] = [];
    let uploadedFile: FileUpload | null = null;

    try {
      if (this.dataSource) {
        const result = await this.dataSource.transaction(async (manager) => {
          const recordRepo = manager.getRepository(MedicalRecord);
          const entryRepo = manager.getRepository(MedicalEntry);
          const vaccinationRepo = manager.getRepository(Vaccination);

          let record = await recordRepo.findOne({ where: { petId } });
          let createdThisTransaction = false;

          if (!record) {
            record = await recordRepo.save(recordRepo.create({ petId }));
            createdThisTransaction = true;
          }

          createdRecordId = record.recordId;
          createdMedicalRecord = createdThisTransaction;
          const entriesToCreate: Partial<MedicalEntry>[] = [];
          const vaccinationsToCreate: Partial<Vaccination>[] = [];

          for (const validRow of validRows) {
            const entry = this.buildMedicalEntry(
              validRow.row,
              record.recordId,
              validRow.row.veterinarianId ?? veterinarianId,
            );

            if (entry) {
              entriesToCreate.push(entryRepo.create(entry));
            }

            const vaccination = this.buildVaccination(
              validRow.row,
              petId,
              validRow.row.veterinarianId ?? veterinarianId,
            );

            if (vaccination) {
              vaccinationsToCreate.push(vaccinationRepo.create(vaccination));
            }
          }

          if (entriesToCreate.length > 0) {
            const savedEntries = await entryRepo.save(entriesToCreate);
            createdEntries.push(...savedEntries);
            createdEntryIds.push(...savedEntries.map((entry) => entry.entryId));
          }

          if (vaccinationsToCreate.length > 0) {
            const savedVaccinations = await vaccinationRepo.save(vaccinationsToCreate);
            createdVaccinations.push(...savedVaccinations);
            createdVaccinationIds.push(...savedVaccinations.map((vaccination) => vaccination.vaccinationId));
          }

          return record;
        });

        createdRecordId = result.recordId;
      } else {
        let record = await this.medicalRecordRepo.findOne({ where: { petId } });

        if (!record) {
          record = await this.medicalRecordRepo.save(
            this.medicalRecordRepo.create({ petId }),
          );
          createdMedicalRecord = true;
        }

        createdRecordId = record.recordId;
        const entriesToCreate: Partial<MedicalEntry>[] = [];
        const vaccinationsToCreate: Partial<Vaccination>[] = [];

        for (const validRow of validRows) {
          const entry = this.buildMedicalEntry(
            validRow.row,
            record.recordId,
            validRow.row.veterinarianId ?? veterinarianId,
          );

          if (entry) {
            entriesToCreate.push(this.medicalEntryRepo.create(entry));
          }

          const vaccination = this.buildVaccination(
            validRow.row,
            petId,
            validRow.row.veterinarianId ?? veterinarianId,
          );

          if (vaccination) {
            vaccinationsToCreate.push(this.vaccinationRepo.create(vaccination));
          }
        }

        if (entriesToCreate.length > 0) {
          const savedEntries = await this.medicalEntryRepo.save(entriesToCreate);
          createdEntries.push(...savedEntries);
          createdEntryIds.push(...savedEntries.map((entry) => entry.entryId));
        }

        if (vaccinationsToCreate.length > 0) {
          const savedVaccinations = await this.vaccinationRepo.save(vaccinationsToCreate);
          createdVaccinations.push(...savedVaccinations);
          createdVaccinationIds.push(...savedVaccinations.map((vaccination) => vaccination.vaccinationId));
        }
      }

      uploadedFile = await this.uploadsService.createFileRecord(
        file,
        FileUploadCategory.DOCUMENT,
        veterinarianId,
        createdRecordId ?? undefined,
      );

      return {
        success: errors.length === 0,
        imported: validRows.length,
        failed: failedRows,
        errors,
        recordId: createdRecordId ?? undefined,
        fileId: uploadedFile?.fileId,
        created: {
          entries: createdEntries,
          vaccinations: createdVaccinations,
        },
      };
    } catch (error) {
      await this.cleanupFailedImport({
        filePath: file.path,
        fileId: uploadedFile?.fileId,
        recordId: createdRecordId,
        createdMedicalRecord,
        createdEntryIds,
        createdVaccinationIds,
      });

      throw error;
    }
  }

  private async cleanupFailedImport(params: {
    filePath: string;
    fileId?: string;
    recordId?: string | null;
    createdMedicalRecord: boolean;
    createdEntryIds: string[];
    createdVaccinationIds: string[];
  }): Promise<void> {
    if (params.fileId) {
      await this.uploadsService.rollbackFileUpload(
        params.filePath,
        params.fileId,
      );
    } else {
      await this.uploadsService.rollbackFileUpload(params.filePath);
    }

    if (params.createdVaccinationIds.length > 0) {
      await this.vaccinationRepo.delete(params.createdVaccinationIds);
    }

    if (params.createdEntryIds.length > 0) {
      await this.medicalEntryRepo.delete(params.createdEntryIds);
    }

    if (params.createdMedicalRecord && params.recordId) {
      await this.medicalRecordRepo.delete(params.recordId);
    }
  }

  async findRecordByPet(petId: string): Promise<MedicalRecordResponse> {
    await this.ensurePetExists(petId);

    const record = await this.medicalRecordRepo.findOne({
      where: { petId },
      relations: ['pet', 'entries', 'entries.veterinarian', 'documents'],
      order: {
        entries: {
          medicalDate: 'DESC',
          createdAt: 'DESC',
        },
        documents: {
          uploadedAt: 'DESC',
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return this.mapRecordResponse(record);
  }

  async findEntry(entryId: string): Promise<MedicalEntryResponse> {
    const entry = await this.getEntryEntity(entryId);
    return this.mapEntryResponse(entry);
  }

  async addEntry(
    petId: string,
    veterinarianId: string,
    dto: CreateMedicalEntryDto,
  ): Promise<MedicalEntryResponse> {
    const { record, created } = await this.findOrCreateRecord(petId);

    const entry = this.medicalEntryRepo.create({
      recordId: record.recordId,
      veterinarianId,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      vaccinationStatus: dto.vaccinationStatus,
      medicalDate: dto.medicalDate,
      notes: dto.notes,
    });

    const savedEntry = await this.medicalEntryRepo.save(entry);

    if (created) {
      await this.activityLogRepo.save(
        this.activityLogRepo.create({
          userId: veterinarianId,
          action: 'MEDICAL_RECORD_CREATED',
          entityType: 'MEDICAL_RECORD',
          entityId: record.recordId,
        }),
      );
    }

    const response = await this.findEntry(savedEntry.entryId);
    const pet = await this.ensurePetExists(petId);
    await this.notificationsService?.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET],
      'Medical entry created',
      `A medical entry was added for ${pet.petName}.`,
      NotificationTypeEnum.MEDICAL,
      [veterinarianId],
    );
    return response;
  }

  async updateEntry(
    entryId: string,
    dto: UpdateMedicalEntryDto,
  ): Promise<MedicalEntryResponse> {
    const entry = await this.getEntryEntity(entryId);

    if (dto.diagnosis !== undefined) entry.diagnosis = dto.diagnosis;
    if (dto.treatment !== undefined) entry.treatment = dto.treatment;
    if (dto.vaccinationStatus !== undefined) {
      entry.vaccinationStatus = dto.vaccinationStatus;
    }
    if (dto.notes !== undefined) entry.notes = dto.notes;

    await this.medicalEntryRepo.save(entry);
    const response = await this.findEntry(entryId);
    await this.notificationsService?.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET],
      'Medical entry updated',
      `A medical entry was updated for ${entry.medicalRecord.pet.petName}.`,
      NotificationTypeEnum.MEDICAL,
    );
    return response;
  }

  async removeEntry(entryId: string): Promise<{ message: string }> {
    const entry = await this.getEntryEntity(entryId);
    await this.medicalEntryRepo.softDelete(entryId);
    await this.notificationsService?.notifyRoles(
      [RolesEnum.ADMIN, RolesEnum.MANAGER, RolesEnum.EMPLOYEE, RolesEnum.VET],
      'Medical entry archived',
      `A medical entry was archived for ${entry.medicalRecord.pet.petName}.`,
      NotificationTypeEnum.MEDICAL,
    );

    return {
      message: 'Medical entry archived successfully',
    };
  }

  private async parseImportFile(file: Express.Multer.File): Promise<Record<string, any>[]> {
    const extension = extname(file.originalname).toLowerCase();

    if (extension !== '.pdf') {
      throw new BadRequestException('Medical data import requires the uploaded PDF medical document.');
    }

    let extractedText: string;
    try {
      const parser = new PDFParse({ data: await readFile(file.path) });
      try {
        const parsedPdf = await parser.getText();
        extractedText = parsedPdf.text;
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      throw new BadRequestException(
        `The uploaded medical PDF could not be read: ${error instanceof Error ? error.message : 'Unknown PDF parse error'}`,
      );
    }

    return this.parseMedicalPdfRecords(extractedText);
  }

  private parseMedicalPdfRecords(text: string): Record<string, any>[] {
    const fields: Record<string, string> = {
      diagnosis: 'Diagnosis',
      treatment: 'Treatment',
      vaccinationStatus: 'Vaccination Status',
      medicalDate: 'Medical Date',
      vaccineName: 'Vaccine Name',
      vaccinationDate: 'Vaccination Date',
      nextDueDate: 'Next Due Date',
      batch: 'Batch',
      notes: 'Notes',
      veterinarianId: 'Veterinarian ID',
    };
    const labels = new Map(Object.entries(fields).map(([key, label]) => [label.toLowerCase(), key]));
    const rows: Record<string, string>[] = [];
    let row: Record<string, string> = {};

    const addRow = () => {
      if (Object.keys(row).length > 0) {
        rows.push(row);
        row = {};
      }
    };

    for (const line of text.split(/\r?\n/)) {
      if (/^\s*(?:medical\s+)?record\s*#?\s*\d*\s*:?\s*$/i.test(line) || /^\s*[-=]{3,}\s*$/.test(line)) {
        addRow();
        continue;
      }

      const match = line.match(/^\s*([^:]+)\s*:\s*(.*)$/);
      if (!match) continue;

      const key = labels.get(match[1].trim().toLowerCase());
      if (!key) continue;
      if (key === 'diagnosis' && Object.keys(row).length > 0) addRow();
      if (match[2].trim()) row[key] = match[2].trim();
    }
    addRow();

    if (rows.length === 0) {
      throw new BadRequestException(
        'The medical PDF does not contain supported labeled fields. Expected labels such as Diagnosis: and Treatment:.',
      );
    }

    return rows;
  }

  private normalizeCsvKey(value: string): string {
    const normalized = value.trim().replace(/[^a-zA-Z0-9_]+/g, ' ');
    const words = normalized.split(/\s+/).map((word) => word.trim()).filter(Boolean);
    const camelCase = words
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toLowerCase() + word.slice(1);
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');

    const aliasMap: Record<string, string> = {
      petid: 'petId',
      diagnosis: 'diagnosis',
      treatment: 'treatment',
      vaccinationstatus: 'vaccinationStatus',
      medicaldate: 'medicalDate',
      vaccine: 'vaccineName',
      vaccname: 'vaccineName',
      vaccinename: 'vaccineName',
      vaccinationdate: 'vaccinationDate',
      nextduedate: 'nextDueDate',
      veterinarianid: 'veterinarianId',
      veterinarian: 'veterinarianId',
      notes: 'notes',
      batch: 'batch',
      status: 'status',
    };

    return aliasMap[camelCase.toLowerCase()] ?? camelCase;
  }

  private async validateImportRow(
    row: Record<string, any>,
    petId: string,
    veterinarianId: string,
    rowNumber: number,
  ): Promise<{ valid: boolean; rowNumber: number; row: Record<string, any>; errors: MedicalImportValidationError[] }> {
    const normalized = this.normalizeRow(row);
    const errors: MedicalImportValidationError[] = [];

    const mappedRow = plainToInstance(MedicalImportRowDto, normalized);
    const validationErrors = await validate(mappedRow);
    for (const validationError of validationErrors) {
      const field = validationError.property;
      const constraints = validationError.constraints ?? {};
      const messages = Object.values(constraints);
      for (const message of messages) {
        errors.push({ row: rowNumber, field, message });
      }
    }

    if (normalized.petId && String(normalized.petId).trim() !== '' && String(normalized.petId).trim() !== petId) {
      errors.push({ row: rowNumber, field: 'petId', message: 'Pet ID does not match the target pet.' });
    }

    if (normalized.veterinarianId && String(normalized.veterinarianId).trim() !== '' && String(normalized.veterinarianId).trim() !== veterinarianId) {
      errors.push({ row: rowNumber, field: 'veterinarianId', message: 'Veterinarian ID does not match the authenticated user.' });
    }

    const resolvedPetId = String(normalized.petId ?? petId).trim();
    const resolvedVeterinarianId = String(normalized.veterinarianId ?? veterinarianId).trim();

    const petExists = await this.petRepo.findOne({ where: { petId: resolvedPetId }, select: { petId: true } });
    if (!petExists) {
      errors.push({ row: rowNumber, field: 'petId', message: 'Pet does not exist.' });
    }

    const veterinarianExists = await this.userRepo.findOne({ where: { userId: resolvedVeterinarianId }, select: { userId: true } });
    if (!veterinarianExists) {
      errors.push({ row: rowNumber, field: 'veterinarianId', message: 'Veterinarian does not exist.' });
    }

    const hasEntryData = this.hasAnyValue(normalized, ['diagnosis', 'treatment', 'vaccinationStatus', 'medicalDate', 'notes']);
    const hasVaccinationData = this.hasAnyValue(normalized, ['vaccineName', 'vaccinationDate', 'nextDueDate', 'batch', 'status']);

    if (!hasEntryData && !hasVaccinationData) {
      errors.push({ row: rowNumber, field: 'record', message: 'No medical data found in this row.' });
    }

    if (hasEntryData) {
      if (!this.hasTextValue(normalized.diagnosis)) {
        errors.push({ row: rowNumber, field: 'diagnosis', message: 'Diagnosis is required.' });
      }
      if (!this.hasTextValue(normalized.treatment)) {
        errors.push({ row: rowNumber, field: 'treatment', message: 'Treatment is required.' });
      }
      if (!this.hasTextValue(normalized.medicalDate) && !this.hasTextValue(normalized.vaccinationDate)) {
        errors.push({ row: rowNumber, field: 'medicalDate', message: 'Medical date is required when diagnosis or treatment is provided.' });
      }
      if (normalized.medicalDate && !this.isValidDateString(String(normalized.medicalDate))) {
        errors.push({ row: rowNumber, field: 'medicalDate', message: 'Invalid medical date format.' });
      }
    }

    if (hasVaccinationData) {
      if (!this.hasTextValue(normalized.vaccineName)) {
        errors.push({ row: rowNumber, field: 'vaccineName', message: 'Vaccine name is required.' });
      }
      if (!this.hasTextValue(normalized.vaccinationDate)) {
        errors.push({ row: rowNumber, field: 'vaccinationDate', message: 'Vaccination date is required.' });
      }
      if (normalized.vaccinationDate && !this.isValidDateString(String(normalized.vaccinationDate))) {
        errors.push({ row: rowNumber, field: 'vaccinationDate', message: 'Invalid vaccination date format.' });
      }
      if (normalized.nextDueDate && !this.isValidDateString(String(normalized.nextDueDate))) {
        errors.push({ row: rowNumber, field: 'nextDueDate', message: 'Invalid next due date format.' });
      }
      if (normalized.nextDueDate && normalized.vaccinationDate && new Date(String(normalized.nextDueDate)) <= new Date(String(normalized.vaccinationDate))) {
        errors.push({ row: rowNumber, field: 'nextDueDate', message: 'Next due date must be after the vaccination date.' });
      }
    }

    if (errors.length > 0) {
      return { valid: false, rowNumber, row: { ...normalized, petId, veterinarianId: resolvedVeterinarianId }, errors };
    }

    return {
      valid: true,
      rowNumber,
      row: {
        ...normalized,
        petId,
        veterinarianId: resolvedVeterinarianId,
        diagnosis: this.toTrimmedString(normalized.diagnosis),
        treatment: this.toTrimmedString(normalized.treatment),
        vaccinationStatus: this.toTrimmedString(normalized.vaccinationStatus) ?? 'VACCINATED',
        medicalDate: this.toTrimmedString(normalized.medicalDate) ?? this.toTrimmedString(normalized.vaccinationDate),
        vaccineName: this.toTrimmedString(normalized.vaccineName),
        vaccinationDate: this.toTrimmedString(normalized.vaccinationDate),
        nextDueDate: this.toTrimmedString(normalized.nextDueDate) ?? null,
        notes: this.toTrimmedString(normalized.notes) ?? null,
      },
      errors: [],
    };
  }

  private normalizeRow(row: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeCsvKey(key);
      normalized[normalizedKey] = value;
    }

    return normalized;
  }

  private buildMedicalEntry(
    row: Record<string, any>,
    recordId: string,
    veterinarianId: string,
  ): Partial<MedicalEntry> | null {
    const diagnosis = this.toTrimmedString(row.diagnosis);
    const treatment = this.toTrimmedString(row.treatment);

    if (!diagnosis || !treatment) {
      return null;
    }

    return {
      recordId,
      veterinarianId,
      diagnosis,
      treatment,
      vaccinationStatus: this.toTrimmedString(row.vaccinationStatus) ?? 'VACCINATED',
      medicalDate: this.toTrimmedString(row.medicalDate) ?? this.toTrimmedString(row.vaccinationDate) ?? new Date().toISOString().slice(0, 10),
      notes: this.toTrimmedString(row.notes) ?? null,
    };
  }

  private buildVaccination(
    row: Record<string, any>,
    petId: string,
    veterinarianId: string,
  ): Partial<Vaccination> | null {
    const vaccineName = this.toTrimmedString(row.vaccineName);
    const vaccinationDate = this.toTrimmedString(row.vaccinationDate);

    if (!vaccineName || !vaccinationDate) {
      return null;
    }

    return {
      petId,
      veterinarianId,
      vaccineName,
      vaccinationDate,
      nextDueDate: this.toTrimmedString(row.nextDueDate) ?? null,
      batch: this.toTrimmedString(row.batch) ?? null,
      status: this.toTrimmedString(row.status) as any ?? 'VACCINATED',
      notes: this.toTrimmedString(row.notes) ?? null,
    };
  }

  private hasAnyValue(row: Record<string, any>, keys: string[]): boolean {
    return keys.some((key) => this.hasTextValue(row[key]));
  }

  private hasTextValue(value: unknown): boolean {
    return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null && String(value).trim().length > 0;
  }

  private toTrimmedString(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const stringValue = String(value).trim();
    return stringValue.length > 0 ? stringValue : null;
  }

  private isValidDateString(value: string): boolean {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  private async getEntryEntity(entryId: string) {
    const entry = await this.medicalEntryRepo.findOne({
      where: { entryId },
      relations: ['veterinarian', 'medicalRecord', 'medicalRecord.pet'],
    });

    if (!entry) {
      throw new NotFoundException('Medical entry not found');
    }

    return entry;
  }

  private async getExistingRecordForPet(petId: string): Promise<MedicalRecord> {
    await this.ensurePetExists(petId);

    const record = await this.medicalRecordRepo.findOne({ where: { petId } });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    return record;
  }

  private mapRecordResponse(record: MedicalRecord): MedicalRecordResponse {
    return {
      recordId: record.recordId,
      petId: record.petId,
      createdAt: record.createdAt,
      pet: {
        petId: record.pet.petId,
        name: record.pet.petName,
        species: record.pet.species,
        breed: record.pet.breed,
        age: record.pet.age,
        gender: record.pet.gender,
        healthStatus: record.pet.healthStatus,
        adoptionStatus: record.pet.adoptionStatus,
      },
      entries: (record.entries ?? []).map((entry) => this.mapEntryResponse(entry)),
      documents: record.documents ?? [],
    };
  }

  private mapEntryResponse(entry: MedicalEntry): MedicalEntryResponse {
    return {
      entryId: entry.entryId,
      recordId: entry.recordId,
      diagnosis: entry.diagnosis,
      treatment: entry.treatment,
      vaccinationStatus: entry.vaccinationStatus,
      medicalDate: entry.medicalDate,
      notes: entry.notes,
      createdAt: entry.createdAt,
      veterinarian: this.mapVeterinarianResponse(entry.veterinarian),
    };
  }

  private mapVeterinarianResponse(
    veterinarian: User,
  ): MedicalVeterinarianResponse {
    return {
      userId: veterinarian.userId,
      firstName: veterinarian.firstName,
      lastName: veterinarian.lastName,
      avatar: veterinarian.avatar,
    };
  }

  private async findOrCreateRecord(petId: string) {
    await this.ensurePetExists(petId);

    const existingRecord = await this.medicalRecordRepo.findOne({
      where: { petId },
    });

    if (existingRecord) {
      return { record: existingRecord, created: false };
    }

    try {
      return {
        record: await this.medicalRecordRepo.save(
          this.medicalRecordRepo.create({ petId }),
        ),
        created: true,
      };
    } catch (error) {
      if (!(error instanceof QueryFailedError && (error as any).code === '23505')) {
        throw error;
      }

      const record = await this.medicalRecordRepo.findOne({ where: { petId } });
      if (!record) {
        throw error;
      }
      return { record, created: false };
    }
  }

  private async ensurePetExists(petId: string) {
    const pet = await this.petRepo.findOne({
      where: { petId },
      select: {
        petId: true,
        petName: true,
      },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }
}
