import { DataSource } from 'typeorm';
import { Department } from '../../entities/department.entity';

export async function seedDepartments(
  dataSource: DataSource,
): Promise<void> {
  const repo = dataSource.getRepository(Department);

  const departments = [
    {
      departmentName: 'Veterinary',
    },
    {
      departmentName: 'Customer Service',
    },
    {
      departmentName: 'Management',
    },
  ];

  for (const department of departments) {
    const exists = await repo.findOne({
      where: {
        departmentName:
          department.departmentName,
      },
    });

    if (!exists) {
      await repo.save(
        repo.create(department),
      );
    }
  }

  console.log('Departments seeded');
}