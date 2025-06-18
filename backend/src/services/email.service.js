const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize the email transporter
  async initialize() {
    try {
      // Check if required environment variables are set
      if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        console.warn('Email service not configured - missing credentials');
        return false;
      }

      // Create transporter based on EMAIL_SERVICE type
      const emailService = process.env.EMAIL_SERVICE || 'smtp';
      
      if (emailService === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD // Use app-specific password for Gmail
          }
        });
      } else {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      }

      // Verify the connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Email service initialization failed:', error.message);
      this.initialized = false;
      return false;
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.initialized && this.transporter;
  }

  // Send a generic email
  async sendEmail({ to, subject, html, text }) {
    if (!this.isAvailable()) {
      console.warn('Email service not available - email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send project invitation email
  async sendProjectInvitation({ email, projectName, inviterName, inviteToken, projectId }) {
    const subject = `You're invited to join "${projectName}" on TaskNest`;
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite?token=${inviteToken}`;
    
    const html = this.generateInvitationTemplate({
      projectName,
      inviterName,
      inviteLink,
      email
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Send password reset email
  async sendPasswordReset({ email, resetToken, userName }) {
    const subject = 'Reset Your TaskNest Password';
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = this.generatePasswordResetTemplate({
      userName,
      resetLink,
      email
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Send notification email
  async sendNotificationEmail({ email, notification, userName }) {
    const subject = `TaskNest Notification: ${notification.type}`;
    
    const html = this.generateNotificationTemplate({
      userName,
      notification,
      email
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Send welcome email for new user registration
  async sendWelcomeEmail({ email, userName, accountType }) {
    const subject = 'Welcome to TaskNest - Your Project Management Journey Begins!';
    
    const html = this.generateWelcomeTemplate({
      userName,
      email,
      accountType: accountType || 'user'
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Generate project invitation email template
  generateInvitationTemplate({ projectName, inviterName, inviteLink, email }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Invitation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #4338CA; }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .logo { font-size: 24px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TaskNest</div>
                <h2>You're Invited to Join a Project!</h2>
            </div>
            <div class="content">
                <p>Hi there!</p>
                <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>"${projectName}"</strong> on TaskNest.</p>
                <p>TaskNest is a modern project management platform that helps teams collaborate efficiently, track progress, and deliver projects on time.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" class="button">Accept Invitation</a>
                </div>
                <p>If you can't click the button above, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">${inviteLink}</p>
                <p>This invitation will expire in 7 days for security reasons.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2025 TaskNest. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate password reset email template
  generatePasswordResetTemplate({ userName, resetLink, email }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; padding: 12px 30px; background: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #DC2626; }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .logo { font-size: 24px; font-weight: bold; }
            .warning { background: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TaskNest</div>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <p>Hi ${userName || 'there'}!</p>
                <p>We received a request to reset your password for your TaskNest account.</p>
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </div>
                <p>To reset your password, click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>If you can't click the button above, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px;">${resetLink}</p>
                <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                <p>If you continue to have problems, please contact our support team.</p>
            </div>
            <div class="footer">
                <p>© 2025 TaskNest. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate notification email template
  generateNotificationTemplate({ userName, notification, email }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TaskNest Notification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .notification-box { background: white; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .logo { font-size: 24px; font-weight: bold; }
            .button { display: inline-block; padding: 12px 30px; background: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TaskNest</div>
                <h2>New Notification</h2>
            </div>
            <div class="content">
                <p>Hi ${userName || 'there'}!</p>
                <p>You have a new notification from TaskNest:</p>
                <div class="notification-box">
                    <h3>${notification.type}</h3>
                    <p>${notification.message}</p>
                    ${notification.createdAt ? `<p><small>Received: ${new Date(notification.createdAt).toLocaleString()}</small></p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View in TaskNest</a>
                </div>
                <p>You can manage your email notification preferences in your account settings.</p>
            </div>
            <div class="footer">
                <p>© 2025 TaskNest. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate welcome email template
  generateWelcomeTemplate({ userName, email, accountType }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TaskNest</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .welcome-box { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .button:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
            .footer { background: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 8px 0; }
            .feature-list li:before { content: "✓"; color: #4CAF50; font-weight: bold; margin-right: 10px; }
            .highlight { color: #667eea; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎯 TaskNest</div>
                <h1>Welcome to Your Project Management Hub!</h1>
                <p>Your journey to better project management starts here</p>
            </div>
            <div class="content">
                <div class="welcome-box">
                    <h2>Hi ${userName || 'there'}! 👋</h2>
                    <p>Congratulations on joining TaskNest! We're excited to help you and your team achieve more together.</p>
                    
                    <p>Your account has been created as a <span class="highlight">${accountType}</span>, and you now have access to:</p>
                    
                    <ul class="feature-list">
                        <li><strong>Project Management:</strong> Create and organize projects with ease</li>
                        <li><strong>Team Collaboration:</strong> Invite team members and work together</li>
                        <li><strong>Task Tracking:</strong> Monitor progress and stay on schedule</li>
                        <li><strong>Real-time Updates:</strong> Get notified about important changes</li>
                        <li><strong>Reporting & Analytics:</strong> Track your team's productivity</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started Now</a>
                </div>
                
                <div class="welcome-box">
                    <h3>🚀 Quick Start Tips:</h3>
                    <ol>
                        <li><strong>Complete your profile</strong> - Add your details and profile picture</li>
                        <li><strong>Create your first project</strong> - Start organizing your work</li>
                        <li><strong>Invite your team</strong> - Collaboration makes everything better</li>
                        <li><strong>Set up notifications</strong> - Stay informed about what matters</li>
                    </ol>
                </div>
                
                <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/help" style="color: #667eea;">Getting Started Guide</a> or contact our support team.</p>
                
                <p>We're here to help you succeed!</p>
                <p><strong>The TaskNest Team</strong></p>
            </div>
            <div class="footer">
                <p>© 2025 TaskNest. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
                <p>You can update your email preferences in your account settings.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Helper method to strip HTML tags for plain text
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService;
