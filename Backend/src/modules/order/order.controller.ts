import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { RequestWithUser } from '@shared/types/auth.types';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADOPTER')
	@Get('me')
	findMine(@Req() req: RequestWithUser) {
		return this.orderService.findMine(req.user.userId);
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADOPTER')
	@Get('me/:orderId')
	findMyOrder(@Req() req: RequestWithUser, @Param('orderId', ParseUUIDPipe) orderId: string) {
		return this.orderService.findMyOrder(req.user.userId, orderId);
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
	@Get()
	findAll() {
		return this.orderService.findAll();
	}
}
