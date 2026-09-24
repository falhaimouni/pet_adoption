import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, link: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your Petopia email',
      text: `Welcome to Petopia! Verify your email to sign in: ${link}\nThis link expires in 24 hours. If you did not sign up, ignore this email.`,
      html: `<h2>Welcome to Petopia</h2><p>Verify your email to sign in:</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours. If you did not sign up, ignore this email.</p>`,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string) {
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
}
