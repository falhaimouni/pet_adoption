import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserAddress1789000000001 implements MigrationInterface {
  name = 'AddUserAddress1789000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'address',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'address');
  }
}