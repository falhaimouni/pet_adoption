import {
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { RequestWithUser } from '@shared/types/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentService } from './payments.service';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session/:orderId')
  createCheckoutSession(
    @Param('orderId') orderId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.paymentService.createCheckoutSession(
      orderId,
      req.user.userId,
    );
  }

  //stripe SDK checks raw body, signature and secret key to verify the webhook request is from stripe
  @Post('webhook')
  handleWebhook(
    //signature sent by stripe to verify the webhook request is from stripe
    @Headers('stripe-signature')
    signature: string,
    @Req() req: Request & {
      //check the original raw body of the request to verify the signature
      rawBody?: Buffer;
    },
  ) {
    if (!req.rawBody) {
      throw new Error(
        'Raw request body is not available',
      );
    }

    return this.paymentService.handleWebhook(
      signature,
      req.rawBody,
    );
  }
}