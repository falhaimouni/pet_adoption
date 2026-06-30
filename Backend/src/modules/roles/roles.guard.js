"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
//can activate guard to check if the user has the required role to access a route
const common_1 = require("@nestjs/common");
//to help reading the metadata set by the Roles decorator
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("./roles.decorator");
//implementing CanActivate to follow certain rules
let RolesGuard = class RolesGuard {
    //to read the roles
    constructor(reflector) {
        this.reflector = reflector;
    }
    //info about the request
    canActivate(context) {
        //ex method has @Roles('admin') and class has @Roles('user'), we will take method level
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, 
        //cuz roles can be set on function or class level
        [context.getHandler(), context.getClass()]);
        if (!requiredRoles)
            return true;
        //switch to http req and get the user from the request object
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        //is the rule in the roles array
        return requiredRoles.includes(user.role);
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
