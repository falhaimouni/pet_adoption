import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingFileUploadColumns1782280000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'file_uploads',
      new TableColumn({
        name: 'file_size',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'file_uploads',
      new TableColumn({
        name: 'category',
        type: 'varchar',
        length: '40',
        isNullable: false,
        default: `'AVATAR'`,
      }),
    );

    await queryRunner.addColumn(
      'file_uploads',
      new TableColumn({
        name: 'mime_type',
        type: 'varchar',
        length: '120',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('file_uploads', 'mime_type');
    await queryRunner.dropColumn('file_uploads', 'category');
    await queryRunner.dropColumn('file_uploads', 'file_size');
  }
}
