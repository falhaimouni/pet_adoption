"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const role_seed_1 = require("./seeds/role.seed");
const department_seed_1 = require("./seeds/department.seed");
const user_seed_1 = require("./seeds/user.seed");
const employee_seed_1 = require("./seeds/employee.seed");
const adopter_seed_1 = require("./seeds/adopter.seed");
const pet_seed_1 = require("./seeds/pet.seed");
const pet_image_seed_1 = require("./seeds/pet-image.seed");
const medical_record_seed_1 = require("./seeds/medical-record.seed");
const vaccination_seed_1 = require("./seeds/vaccination.seed");
const adoption_request_seed_1 = require("./seeds/adoption-request.seed");
const adoption_seed_1 = require("./seeds/adoption.seed");
const conversation_seed_1 = require("./seeds/conversation.seed");
const message_seed_1 = require("./seeds/message.seed");
const supplier_seed_1 = require("./seeds/supplier.seed");
const supply_seed_1 = require("./seeds/supply.seed");
const supplier_supply_seed_1 = require("./seeds/supplier-supply.seed");
class SeedService {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async seed() {
        //core system
        await (0, role_seed_1.seedRoles)(this.dataSource);
        await (0, department_seed_1.seedDepartments)(this.dataSource);
        //users system
        await (0, user_seed_1.seedUsers)(this.dataSource);
        await (0, employee_seed_1.seedEmployees)(this.dataSource);
        await (0, adopter_seed_1.seedAdopters)(this.dataSource);
        //pets system
        await (0, pet_seed_1.seedPets)(this.dataSource);
        await (0, pet_image_seed_1.seedPetImages)(this.dataSource);
        await (0, medical_record_seed_1.seedMedicalRecords)(this.dataSource);
        await (0, vaccination_seed_1.seedVaccinations)(this.dataSource);
        //adoption system
        await (0, adoption_request_seed_1.seedAdoptionRequests)(this.dataSource);
        await (0, adoption_seed_1.seedAdoptions)(this.dataSource);
        //messaging system
        await (0, conversation_seed_1.seedConversations)(this.dataSource);
        await (0, message_seed_1.seedMessages)(this.dataSource);
        //suppliers system
        await (0, supplier_seed_1.seedSuppliers)(this.dataSource);
        await (0, supply_seed_1.seedSupplies)(this.dataSource);
        await (0, supplier_supply_seed_1.seedSupplierSupplies)(this.dataSource);
    }
}
exports.SeedService = SeedService;
