//can activate guard to check if the user has the required role to access a route
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
//to help reading the metadata set by the Roles decorator
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

//implementing CanActivate to follow certain rules
@Injectable()
export class RolesGuard implements CanActivate {
    //to read the roles
  constructor(private reflector: Reflector) {}

  //info about the request
  canActivate(context: ExecutionContext): boolean {
    //ex method has @Roles('admin') and class has @Roles('user'), we will take method level
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      //cuz roles can be set on function or class level
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    //switch to http req and get the user from the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    //is the rule in the roles array
    return requiredRoles.includes(user.role);
  }
}
