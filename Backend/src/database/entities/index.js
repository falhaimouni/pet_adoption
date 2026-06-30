"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseEntities = exports.Vaccination = exports.User = exports.Supply = exports.SupplierSupply = exports.Supplier = exports.Role = exports.PetImage = exports.Pet = exports.PasswordResetToken = exports.OAuthAccount = exports.Notification = exports.Message = exports.MedicalEntry = exports.MedicalRecord = exports.FileUpload = exports.Employee = exports.Department = exports.Conversation = exports.Adopter = exports.AdoptionRequest = exports.Adoption = exports.ActivityLog = void 0;
var activity_log_entity_1 = require("./activity-log.entity");
Object.defineProperty(exports, "ActivityLog", { enumerable: true, get: function () { return activity_log_entity_1.ActivityLog; } });
var adoption_entity_1 = require("./adoption.entity");
Object.defineProperty(exports, "Adoption", { enumerable: true, get: function () { return adoption_entity_1.Adoption; } });
var adoption_request_entity_1 = require("./adoption-request.entity");
Object.defineProperty(exports, "AdoptionRequest", { enumerable: true, get: function () { return adoption_request_entity_1.AdoptionRequest; } });
var adopter_entity_1 = require("./adopter.entity");
Object.defineProperty(exports, "Adopter", { enumerable: true, get: function () { return adopter_entity_1.Adopter; } });
var conversation_entity_1 = require("./conversation.entity");
Object.defineProperty(exports, "Conversation", { enumerable: true, get: function () { return conversation_entity_1.Conversation; } });
var department_entity_1 = require("./department.entity");
Object.defineProperty(exports, "Department", { enumerable: true, get: function () { return department_entity_1.Department; } });
var employee_entity_1 = require("./employee.entity");
Object.defineProperty(exports, "Employee", { enumerable: true, get: function () { return employee_entity_1.Employee; } });
var file_upload_entity_1 = require("./file-upload.entity");
Object.defineProperty(exports, "FileUpload", { enumerable: true, get: function () { return file_upload_entity_1.FileUpload; } });
var medical_record_entity_1 = require("./medical-record.entity");
Object.defineProperty(exports, "MedicalRecord", { enumerable: true, get: function () { return medical_record_entity_1.MedicalRecord; } });
var medical_entry_entity_1 = require("./medical-entry.entity");
Object.defineProperty(exports, "MedicalEntry", { enumerable: true, get: function () { return medical_entry_entity_1.MedicalEntry; } });
var message_entity_1 = require("./message.entity");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return message_entity_1.Message; } });
var notification_entity_1 = require("./notification.entity");
Object.defineProperty(exports, "Notification", { enumerable: true, get: function () { return notification_entity_1.Notification; } });
var oauth_account_entity_1 = require("./oauth-account.entity");
Object.defineProperty(exports, "OAuthAccount", { enumerable: true, get: function () { return oauth_account_entity_1.OAuthAccount; } });
var password_reset_token_entity_1 = require("./password-reset-token.entity");
Object.defineProperty(exports, "PasswordResetToken", { enumerable: true, get: function () { return password_reset_token_entity_1.PasswordResetToken; } });
var pet_entity_1 = require("./pet.entity");
Object.defineProperty(exports, "Pet", { enumerable: true, get: function () { return pet_entity_1.Pet; } });
var pet_image_entity_1 = require("./pet-image.entity");
Object.defineProperty(exports, "PetImage", { enumerable: true, get: function () { return pet_image_entity_1.PetImage; } });
var role_entity_1 = require("./role.entity");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_entity_1.Role; } });
var supplier_entity_1 = require("./supplier.entity");
Object.defineProperty(exports, "Supplier", { enumerable: true, get: function () { return supplier_entity_1.Supplier; } });
var supplier_supply_entity_1 = require("./supplier-supply.entity");
Object.defineProperty(exports, "SupplierSupply", { enumerable: true, get: function () { return supplier_supply_entity_1.SupplierSupply; } });
var supply_entity_1 = require("./supply.entity");
Object.defineProperty(exports, "Supply", { enumerable: true, get: function () { return supply_entity_1.Supply; } });
var user_entity_1 = require("./user.entity");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_entity_1.User; } });
var vaccination_entity_1 = require("./vaccination.entity");
Object.defineProperty(exports, "Vaccination", { enumerable: true, get: function () { return vaccination_entity_1.Vaccination; } });
const activity_log_entity_2 = require("./activity-log.entity");
const adoption_entity_2 = require("./adoption.entity");
const adoption_request_entity_2 = require("./adoption-request.entity");
const adopter_entity_2 = require("./adopter.entity");
const conversation_entity_2 = require("./conversation.entity");
const department_entity_2 = require("./department.entity");
const employee_entity_2 = require("./employee.entity");
const file_upload_entity_2 = require("./file-upload.entity");
const medical_record_entity_2 = require("./medical-record.entity");
const medical_entry_entity_2 = require("./medical-entry.entity");
const message_entity_2 = require("./message.entity");
const notification_entity_2 = require("./notification.entity");
const oauth_account_entity_2 = require("./oauth-account.entity");
const password_reset_token_entity_2 = require("./password-reset-token.entity");
const pet_entity_2 = require("./pet.entity");
const pet_image_entity_2 = require("./pet-image.entity");
const role_entity_2 = require("./role.entity");
const supplier_entity_2 = require("./supplier.entity");
const supplier_supply_entity_2 = require("./supplier-supply.entity");
const supply_entity_2 = require("./supply.entity");
const user_entity_2 = require("./user.entity");
const vaccination_entity_2 = require("./vaccination.entity");
exports.databaseEntities = [
    activity_log_entity_2.ActivityLog,
    adoption_entity_2.Adoption,
    adoption_request_entity_2.AdoptionRequest,
    adopter_entity_2.Adopter,
    conversation_entity_2.Conversation,
    department_entity_2.Department,
    employee_entity_2.Employee,
    file_upload_entity_2.FileUpload,
    medical_record_entity_2.MedicalRecord,
    medical_entry_entity_2.MedicalEntry,
    message_entity_2.Message,
    notification_entity_2.Notification,
    oauth_account_entity_2.OAuthAccount,
    password_reset_token_entity_2.PasswordResetToken,
    pet_entity_2.Pet,
    pet_image_entity_2.PetImage,
    role_entity_2.Role,
    supplier_entity_2.Supplier,
    supplier_supply_entity_2.SupplierSupply,
    supply_entity_2.Supply,
    user_entity_2.User,
    vaccination_entity_2.Vaccination,
];
