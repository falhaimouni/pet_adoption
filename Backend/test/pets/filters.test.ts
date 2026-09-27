import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FindPetsQueryDto } from '@shared/dto/find-pets-query.dto';
import { PetsService } from '../../src/modules/pets/pets.service';

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
const parse = (value: unknown) => pipe.transform(value, { type: 'query', metatype: FindPetsQueryDto });

test('pet filters accept single or multiple selections and validate every value', async () => {
  assert.equal((await parse({ species: 'Dog' })).species, 'Dog');
  const query = await parse({ species: ['Dog', 'Cat'], status: ['available', 'pending'] });
  assert.deepEqual(query.species, ['Dog', 'Cat']);
  assert.deepEqual(query.status, ['AVAILABLE', 'PENDING']);
  for (const invalid of [{ species: ['Dog', 'Invalid'] }, { status: ['AVAILABLE', 'Invalid'] }]) {
    await assert.rejects(() => parse(invalid), BadRequestException);
  }
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
