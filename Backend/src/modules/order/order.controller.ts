import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
	@Get()
	findAll() {
		return this.orderService.findAll();
	}
}
