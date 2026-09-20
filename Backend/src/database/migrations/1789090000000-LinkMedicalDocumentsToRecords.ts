import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class LinkMedicalDocumentsToRecords1789090000000
  implements MigrationInterface
{
  name = 'LinkMedicalDocumentsToRecords1789090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'file_uploads',
      new TableColumn({
        name: 'medical_record_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'file_uploads',
      new TableForeignKey({
        name: 'FK_file_uploads_medical_record',
        columnNames: ['medical_record_id'],
        referencedTableName: 'medical_records',
        referencedColumnNames: ['record_id'],
        onDelete: 'SET NULL',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'file_uploads',
      'FK_file_uploads_medical_record',
    );
    await queryRunner.dropColumn('file_uploads', 'medical_record_id');
  }
}
