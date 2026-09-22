import { DataSource } from 'typeorm';

import { seedRoles } from './seeds/role.seed';
import { seedDepartments } from './seeds/department.seed';
import { seedUsers } from './seeds/user.seed';
import { seedEmployees } from './seeds/employee.seed';
import { seedAdopters } from './seeds/adopter.seed';
import { seedPets } from './seeds/pet.seed';

import { seedPetImages } from './seeds/pet-image.seed';
import { seedMedicalRecords } from './seeds/medical-record.seed';
import { seedVaccinations } from './seeds/vaccination.seed';

import { seedAdoptionRequests } from './seeds/adoption-request.seed';
import { seedAdoptions } from './seeds/adoption.seed';

import { seedConversations } from './seeds/conversation.seed';
import { seedMessages } from './seeds/message.seed';
import { seedFriendships } from './seeds/friendship.seed';

import { seedSuppliers } from './seeds/supplier.seed';
import { seedSupplies } from './seeds/supply.seed';
import { seedProducts } from './seeds/product.seed';
import { seedCarts } from './seeds/cart.seed';
import { seedCartItems } from './seeds/cart-item.seed';
import { seedOrders } from './seeds/order.seed';
import { seedOrderItems } from './seeds/order-item.seed';
import { seedPayments } from './seeds/payment.seed';

export class SeedService {
  constructor(private readonly dataSource: DataSource) {}

  async seed() {
    //core system
    await seedRoles(this.dataSource);
    await seedDepartments(this.dataSource);

    //users system
    await seedUsers(this.dataSource);
    await seedEmployees(this.dataSource);
    await seedAdopters(this.dataSource);
    await seedFriendships(this.dataSource);
    //pets system
    await seedPets(this.dataSource);
    await seedPetImages(this.dataSource);
    await seedMedicalRecords(this.dataSource);
    await seedVaccinations(this.dataSource);

    //adoption system
    await seedAdoptionRequests(this.dataSource);
    await seedAdoptions(this.dataSource);

    //messaging system
    await seedConversations(this.dataSource);
    await seedMessages(this.dataSource);

    //suppliers system
    await seedSuppliers(this.dataSource);

    //commerce system
    await seedProducts(this.dataSource);
    await seedSupplies(this.dataSource);
    await seedCarts(this.dataSource);
    await seedCartItems(this.dataSource);
    await seedOrders(this.dataSource);
    await seedOrderItems(this.dataSource);
    await seedPayments(this.dataSource);
  }
}
