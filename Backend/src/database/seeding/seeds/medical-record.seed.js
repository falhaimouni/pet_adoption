"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMedicalRecords = seedMedicalRecords;
const medical_record_entity_1 = require("../../entities/medical-record.entity");
const medical_entry_entity_1 = require("../../entities/medical-entry.entity");
const pet_entity_1 = require("../../entities/pet.entity");
const user_entity_1 = require("../../entities/user.entity");
async function seedMedicalRecords(dataSource) {
    const repo = dataSource.getRepository(medical_record_entity_1.MedicalRecord);
    const entryRepo = dataSource.getRepository(medical_entry_entity_1.MedicalEntry);
    const petRepo = dataSource.getRepository(pet_entity_1.Pet);
    const userRepo = dataSource.getRepository(user_entity_1.User);
    const pets = await petRepo.find();
    const vet = await userRepo.findOne({
        where: { email: 'vet@test.com' },
    });
    if (!vet)
        return;
    for (const pet of pets) {
        let record = await repo.findOne({
            where: { petId: pet.petId },
        });
        if (!record) {
            record = await repo.save(repo.create({ pet }));
        }
        // Create multiple entries per record for variety
        const sampleEntries = [
            {
                diagnosis: 'General Checkup',
                treatment: 'Basic examination and weight check',
                vaccinationStatus: 'Up to date',
                medicalDate: '2025-01-15'
            },
            {
                diagnosis: 'Healthy',
                treatment: 'No treatment required',
                vaccinationStatus: 'Up to date',
                medicalDate: new Date().toISOString().split('T')[0]
            }
        ];
        for (const entryData of sampleEntries) {
            // Check if this specific entry already exists for this record to ensure idempotency
            const entryExists = await entryRepo.findOne({
                where: {
                    medicalRecord: { recordId: record.recordId },
                    diagnosis: entryData.diagnosis,
                    medicalDate: entryData.medicalDate,
                },
            });
            const entry = {
                ...entryData,
                medicalRecord: record,
                veterinarian: vet,
            };
            if (entryExists) {
                await entryRepo.save(entryRepo.merge(entryExists, entry));
            }
            else {
                await entryRepo.save(entryRepo.create(entry));
            }
        }
    }
    console.log('Medical Records seeded');
}
