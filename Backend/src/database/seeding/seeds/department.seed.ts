import { DataSource } from 'typeorm';
import { Department } from '../../entities/department.entity';

export async function seedDepartments(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Department);

  const departments = [
    {
      departmentName: 'Veterinary',
      description: 'Veterinary care and animal health services',
    },
    {
      departmentName: 'Customer Service',
      description: 'Adoption support and customer assistance',
    },
    {
      departmentName: 'Management',
      description: 'Shelter administration and operations',
    },
  ];

  for (const department of departments) {
    const exists = await repo
      .createQueryBuilder('department')
      .where(
        'LOWER(BTRIM(department.department_name)) = LOWER(BTRIM(:departmentName))',
        { departmentName: department.departmentName },
      )
      .getOne();

    if (exists) {
      await repo.save(
        repo.merge(exists, department, { isActive: true }),
      );
    } else {
      await repo.save(
        repo.create(department),
      );
    }
  }

  console.log('Departments seeded');
}
