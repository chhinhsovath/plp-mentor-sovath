import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: any;
  html?: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    // Load email templates
    this.loadTemplates();
  }

  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, '../../templates/email');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      this.createDefaultTemplates(templatesDir);
    }

    // Load all template files
    const templateFiles = fs.readdirSync(templatesDir);
    
    for (const file of templateFiles) {
      if (file.endsWith('.hbs')) {
        const templateName = file.replace('.hbs', '');
        const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        this.templates.set(templateName, handlebars.compile(templateContent));
      }
    }
  }

  private createDefaultTemplates(dir: string): void {
    // Notification template
    const notificationTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .priority-urgent { color: #ff4d4f; font-weight: bold; }
    .priority-high { color: #fa8c16; font-weight: bold; }
    .priority-medium { color: #1890ff; }
    .priority-low { color: #8c8c8c; }
    .actions { margin-top: 20px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #1890ff; color: white; text-decoration: none; border-radius: 4px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #8c8c8c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PLP Mentor Platform</h1>
    </div>
    <div class="content">
      <h2>សួស្តី {{userName}},</h2>
      <h3>{{title}}</h3>
      <p class="priority-{{priority}}">{{message}}</p>
      
      {{#if actions}}
      <div class="actions">
        {{#each actions}}
        <a href="{{this.url}}" class="button">{{this.label}}</a>
        {{/each}}
      </div>
      {{/if}}
    </div>
    <div class="footer">
      <p>នេះគឺជាការជូនដំណឹងដោយស្វ័យប្រវត្តិពី PLP Mentor Platform</p>
      <p>សូមកុំឆ្លើយតបអ៊ីមែលនេះ</p>
    </div>
  </div>
</body>
</html>
    `;

    // Digest template
    const digestTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .notification-item { padding: 15px; margin-bottom: 10px; background-color: #f5f5f5; border-left: 4px solid #1890ff; }
    .notification-title { font-weight: bold; margin-bottom: 5px; }
    .notification-time { font-size: 12px; color: #8c8c8c; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #8c8c8c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ការជូនដំណឹង{{#if (eq frequency 'daily')}}ប្រចាំថ្ងៃ{{else}}ប្រចាំសប្តាហ៍{{/if}}</h1>
    </div>
    <div class="content">
      <p>អ្នកមានការជូនដំណឹងចំនួន {{notifications.length}} មិនទាន់អាន:</p>
      
      {{#each notifications}}
      <div class="notification-item">
        <div class="notification-title">{{this.title}}</div>
        <div>{{this.message}}</div>
        <div class="notification-time">{{this.time}}</div>
      </div>
      {{/each}}
      
      <p style="margin-top: 20px;">
        <a href="{{appUrl}}/notifications" style="color: #1890ff;">មើលការជូនដំណឹងទាំងអស់</a>
      </p>
    </div>
    <div class="footer">
      <p>អ្នកទទួលបានអ៊ីមែលនេះព្រោះអ្នកបានជាវការជូនដំណឹង{{#if (eq frequency 'daily')}}ប្រចាំថ្ងៃ{{else}}ប្រចាំសប្តាហ៍{{/if}}</p>
      <p><a href="{{appUrl}}/settings" style="color: #8c8c8c;">កែប្រែការកំណត់ការជូនដំណឹង</a></p>
    </div>
  </div>
</body>
</html>
    `;

    fs.writeFileSync(path.join(dir, 'notification.hbs'), notificationTemplate);
    fs.writeFileSync(path.join(dir, 'digest.hbs'), digestTemplate);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html: string;

      if (options.template && this.templates.has(options.template)) {
        const template = this.templates.get(options.template)!;
        html = template(options.context || {});
      } else if (options.html) {
        html = options.html;
      } else {
        throw new Error('No template or HTML content provided');
      }

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@plp-mentor.edu.kh'),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      });

      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendNotificationEmail(options: EmailOptions): Promise<void> {
    return this.sendEmail({
      ...options,
      template: 'notification',
    });
  }

  async sendDigestEmail(options: {
    to: string;
    subject: string;
    notifications: any[];
    frequency?: 'daily' | 'weekly';
  }): Promise<void> {
    return this.sendEmail({
      to: options.to,
      subject: options.subject,
      template: 'digest',
      context: {
        notifications: options.notifications,
        frequency: options.frequency || 'daily',
        appUrl: this.configService.get('APP_URL', 'https://plp-mentor.edu.kh'),
      },
    });
  }

  async sendTestEmail(to: string, notification: { title: string; message: string }): Promise<void> {
    return this.sendEmail({
      to,
      subject: 'ការសាកល្បងអ៊ីមែល - PLP Mentor',
      template: 'notification',
      context: {
        userName: 'អ្នកប្រើប្រាស់',
        title: notification.title,
        message: notification.message,
        priority: 'low',
      },
    });
  }
}