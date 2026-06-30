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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let MailService = class MailService {
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendPasswordResetEmail(email, resetLink) {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset Your Password',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="margin-bottom: 12px;">Password Reset</h2>
          <p>You requested a password reset.</p>
          <p>Click the button below to reset your password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>If the button does not work, copy and open this link in your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p style="margin-top: 20px; color: #6b7280;">This link expires in 1 hour.</p>
        </div>
      `,
            text: `Password Reset\n\nYou requested a password reset.\nOpen this link to continue: ${resetLink}\n\nThis link expires in 1 hour.`,
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
