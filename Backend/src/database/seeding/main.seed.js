"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//connect to db then run seed service then disconnect db
//to read decorators
require("reflect-metadata");
const data_source_1 = __importDefault(require("../data-source"));
const seed_service_1 = require("./seed.service");
async function runSeed() {
    try {
        await data_source_1.default.initialize();
        //so it can access the repositories to perform seeding operations
        const seedService = new seed_service_1.SeedService(data_source_1.default);
        await seedService.seed();
        console.log('Seeding completed successfully');
    }
    catch (error) {
        console.error('Seeding failed:', error);
    }
    //always disconnect from the DB 
    finally {
        await data_source_1.default.destroy();
    }
}
runSeed();
