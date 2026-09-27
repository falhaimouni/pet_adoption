import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FindPetsQueryDto } from '@shared/dto/find-pets-query.dto';
import { CreatePetDto, UpdatePetDto } from '@shared/dto/pet.dto';
import { PetsService } from '../../src/modules/pets/pets.service';

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const parse = (value: unknown) => pipe.transform(value, { type: 'query', metatype: FindPetsQueryDto });
const parseCreate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: CreatePetDto });
const parseUpdate = (value: unknown) => pipe.transform(value, { type: 'body', metatype: UpdatePetDto });

test('pet filters accept single or multiple selections and validate every value', async () => {
  assert.equal((await parse({ species: 'Dog' })).species, 'Dog');
  const query = await parse({ species: ['Dog', 'Cat'], status: ['available', 'pending'] });
  assert.deepEqual(query.species, ['Dog', 'Cat']);
  assert.deepEqual(query.status, ['AVAILABLE', 'PENDING']);
  assert.equal((await parse({ status: 'medical hold' })).status, 'MEDICAL_HOLD');
  for (const invalid of [{ species: ['Dog', 'Invalid'] }, { status: ['AVAILABLE', 'Invalid'] }]) {
    await assert.rejects(() => parse(invalid), BadRequestException);
  }
});

test('pet update normalizes adoption status values before validation', async () => {
  assert.equal((await parseUpdate({ adoptionStatus: 'available' })).adoptionStatus, 'AVAILABLE');
  assert.equal((await parseUpdate({ adoptionStatus: 'medical hold' })).adoptionStatus, 'MEDICAL_HOLD');
  assert.equal((await parseUpdate({ adoptionStatus: 'medical_hold' })).adoptionStatus, 'MEDICAL_HOLD');
  await assert.rejects(() => parseUpdate({ adoptionStatus: 'not available' }), BadRequestException);
});

test('pet create and update reject invalid field data', async () => {
  await assert.rejects(() => parseCreate({ name: '123', species: 'Dog' }), BadRequestException);
  await assert.rejects(() => parseCreate({ name: 'Luna', species: 'Dog', breed: '123' }), BadRequestException);
  await assert.rejects(() => parseCreate({ name: 'Luna', species: 'Dog', gender: 'Other' }), BadRequestException);
  await assert.rejects(() => parseUpdate({ color: '456' }), BadRequestException);
  await assert.rejects(() => parseUpdate({ healthStatus: 'Sick' }), BadRequestException);
  assert.equal((await parseCreate({ name: 'Luna', species: 'Cat', breed: 'Domestic Shorthair', gender: 'Female', color: 'Black & White' })).breed, 'Domestic Shorthair');
  assert.equal((await parseUpdate({ healthStatus: 'Healthy' })).healthStatus, 'Healthy');
});

test('multiple selections constrain the database query before counting and pagination', async () => {
  const calls: Array<[string, any]> = [];
  const qb: any = {};
  for (const method of ['leftJoinAndSelect', 'orderBy', 'addOrderBy', 'skip', 'take']) {
    qb[method] = () => qb;
  }
  qb.andWhere = (sql: string, params: any) => { calls.push([sql, params]); return qb; };
  qb.getManyAndCount = async () => {
    assert.deepEqual(calls, [
      ['LOWER(pet.species) IN (:...species)', { species: ['dog', 'cat'] }],
      ['LOWER(pet.adoptionStatus) IN (:...statuses)', { statuses: ['available', 'pending'] }],
    ]);
    return [[], 0];
  };
  const service = new PetsService({ createQueryBuilder: () => qb } as any,
    {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  const result = await service.findAll(await parse({ species: ['Dog', 'Cat'], status: ['AVAILABLE', 'PENDING'], page: '2', limit: '9' }));
  assert.equal(result.page, 2);
  assert.equal(result.limit, 9);
});
