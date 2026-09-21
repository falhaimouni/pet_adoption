import { DataSource } from 'typeorm';

import { Department } from '../../entities/department.entity';
import { Employee } from '../../entities/employee.entity';
import { User } from '../../entities/user.entity';

type ProductionEmployee = {
  email: string;
  departmentName: string;
  salary: string;
};

export async function seedProductionEmployees(
  dataSource: DataSource,
): Promise<void> {
  const employeeRepo = dataSource.getRepository(Employee);
  const userRepo = dataSource.getRepository(User);
  const departmentRepo = dataSource.getRepository(Department);

  const employees: ProductionEmployee[] = [
    {
      email: process.env.PRODUCTION_VET_EMAIL!,
      departmentName: 'Veterinary',
      salary: '0',
    },
    {
      email: process.env.PRODUCTION_MANAGER_EMAIL!,
      departmentName: 'Management',
      salary: '0',
    },
    {
      email: process.env.PRODUCTION_EMPLOYEE_ONE_EMAIL!,
      departmentName: 'Customer Service',
      salary: '0',
    },
    {
      email: process.env.PRODUCTION_EMPLOYEE_TWO_EMAIL!,
      departmentName: 'Veterinary',
      salary: '0',
    },
    {
      email: process.env.PRODUCTION_EMPLOYEE_THREE_EMAIL!,
      departmentName: 'Management',
      salary: '0',
    },
  ];

  for (const employee of employees) {
    const user = await userRepo.findOne({
      where: { email: employee.email },
    });
    const department = await departmentRepo.findOne({
      where: { departmentName: employee.departmentName },
    });

    if (!user || !department) {
      throw new Error(
        `User and department must exist before production employees: ${employee.email}`,
      );
    }

    const employeeData = {
      user,
      department,
      salary: employee.salary,
      hireDate: new Date().toISOString().slice(0, 10),
      address: null,
      status: 'active',
    };
    const existingEmployee = await employeeRepo.findOne({
      where: { userId: user.userId },
    });

    if (existingEmployee) {
      await employeeRepo.save(employeeRepo.merge(existingEmployee, employeeData));
    } else {
      await employeeRepo.save(employeeRepo.create(employeeData));
    }
  }

  console.log('Production employees seeded');
}