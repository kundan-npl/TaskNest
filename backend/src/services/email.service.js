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

  // Send project milestone completion email
  async sendProjectMilestoneEmail({ email, userName, milestoneTitle, projectName, completedBy, projectId }) {
    const subject = `🎯 Milestone Completed: "${milestoneTitle}" in ${projectName}`;
    
    const html = this.generateMilestoneCompletionTemplate({
      userName,
      milestoneTitle,
      projectName,
      completedBy,
      email,
      projectId
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Send team member added email
  async sendTeamMemberAddedEmail({ email, userName, projectName, newMemberName, addedBy, projectId }) {
    const subject = `👥 New Team Member Added to "${projectName}"`;
    
    const html = this.generateTeamMemberAddedTemplate({
      userName,
      projectName,
      newMemberName,
      addedBy,
      email,
      projectId
    });

    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Send project completion email
  async sendProjectCompletionEmail({ email, userName, projectName, completedBy, projectStats, projectId }) {
    const subject = `🎉 Project Completed: "${projectName}"`;
    
    const html = this.generateProjectCompletionTemplate({
      userName,
      projectName,
      completedBy,
      projectStats,
      email,
      projectId
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
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
            }
            .container { 
                width: 100%; 
                max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.6;
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: 600;
                font-size: 16px;
                max-width: 100%;
                box-sizing: border-box;
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #666;
            }
            .logo { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .highlight-box {
                background: #f8f9ff;
                border-left: 4px solid #4F46E5;
                padding: 15px;
                margin: 20px 0;
            }
            .link-box {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
                word-break: break-all;
                font-family: monospace;
                font-size: 14px;
                margin: 15px 0;
            }
            @media only screen and (max-width: 600px) {
                .button {
                    display: block;
                    text-align: center;
                    width: calc(100% - 40px);
                    max-width: 280px;
                    margin: 20px auto;
                    padding: 12px 20px;
                    font-size: 15px;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 25px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📧 TaskNest</div>
                <h1 style="margin: 10px 0; font-size: 28px;">You're Invited!</h1>
                <p style="margin: 10px 0; font-size: 16px;">Join an exciting project collaboration</p>
            </div>
            <div class="content">
                <h2 style="color: #333; margin-top: 0;">Hi there! 👋</h2>
                <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>"${projectName}"</strong> on TaskNest.</p>
                
                <div class="highlight-box">
                    <h3 style="margin-top: 0; color: #4F46E5;">🚀 What is TaskNest?</h3>
                    <p style="margin-bottom: 0;">TaskNest is a modern project management platform that helps teams collaborate efficiently, track progress, and deliver projects on time.</p>
                </div>
                
                <div style="text-align: center; margin: 20px 0; padding: 0 10px;">
                    <a href="${inviteLink}" class="button">🎯 Accept Invitation</a>
                </div>
                
                <p><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
                <div class="link-box">${inviteLink}</div>
                
                <p style="color: #666; font-size: 14px;">⏰ This invitation will expire in 7 days for security reasons.</p>
                <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p style="margin: 5px 0;">© 2025 TaskNest. All rights reserved.</p>
                <p style="margin: 5px 0;">This email was sent to ${email}</p>
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
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
            }
            .container { 
                width: 100%; 
                max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.6;
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: 600;
                font-size: 16px;
                max-width: 100%;
                box-sizing: border-box;
                word-wrap: break-word;
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #666;
            }
            .logo { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .warning { 
                background: #fef2f2; 
                border: 2px solid #fca5a5; 
                padding: 15px; 
                border-radius: 6px; 
                margin: 20px 0; 
            }
            .link-box {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                border: 1px solid #dee2e6;
                word-break: break-all;
                font-family: monospace;
                font-size: 14px;
                margin: 15px 0;
            }
            @media only screen and (max-width: 600px) {
                .button {
                    display: block;
                    text-align: center;
                    width: calc(100% - 40px);
                    max-width: 280px;
                    margin: 20px auto;
                    padding: 12px 20px;
                    font-size: 15px;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 25px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 TaskNest</div>
                <h1 style="margin: 0; font-size: 32px;">Password Reset Request</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Secure your account with a new password</p>
            </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                    <p style="font-size: 17px; margin-bottom: 20px;">We received a request to reset your password for your TaskNest account.</p>
                    
                    <div class="warning">
                        <p style="margin: 0; color: #dc2626; font-weight: 600;"><strong>🛡️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                    </div>
                    
                    <p style="font-size: 17px;">To reset your password, click the button below:</p>
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${resetLink}" class="button">🔑 Reset Password</a>
                    </div>
                    
                    <div class="security-notice">
                        <p style="margin: 0; color: #ea580c;"><strong>⏰ Time Sensitive:</strong> This link will expire in 1 hour for security reasons.</p>
                    </div>
                    
                    <p style="margin-top: 30px;"><strong>Can't click the button?</strong> Copy and paste this link into your browser:</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6; word-break: break-all; font-family: monospace; font-size: 14px; margin: 15px 0;">
                        ${resetLink}
                    </div>
                    
                    <p style="color: #6c757d; margin-top: 30px;">If you continue to have problems, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0;">This email was sent to ${email}</p>
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
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
            }
            .container { 
                width: 100%; 
                max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.6;
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: 600;
                font-size: 16px;
                max-width: 100%;
                box-sizing: border-box;
                word-wrap: break-word;
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #666;
            }
            .logo { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .notification-box { 
                background: #f0fdf4; 
                border-left: 4px solid #059669; 
                padding: 15px; 
                margin: 20px 0; 
            }
            .notification-meta {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
                border: 1px solid #dee2e6;
            }
            @media only screen and (max-width: 600px) {
                .button {
                    display: block;
                    text-align: center;
                    width: calc(100% - 40px);
                    max-width: 280px;
                    margin: 20px auto;
                    padding: 12px 20px;
                    font-size: 15px;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 25px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔔 TaskNest</div>
                <h1 style="margin: 0; font-size: 32px;">New Notification</h1>
                <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Stay updated with your projects</p>
            </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                    <p style="font-size: 17px; margin-bottom: 20px;">You have a new notification from TaskNest:</p>
                    
                    <div class="notification-box">
                        <h3 style="color: #059669; margin-top: 0; font-size: 20px;">📋 ${notification.type}</h3>
                        <p style="font-size: 16px; margin: 15px 0; line-height: 1.6;">${notification.message}</p>
                        ${notification.createdAt ? `
                        <div class="notification-meta">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>⏰ Received:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">📊 View in TaskNest</a>
                    </div>
                    
                    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0; color: #92400e;"><strong>⚙️ Tip:</strong> You can manage your email notification preferences in your account settings.</p>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0;">This email was sent to ${email}</p>
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
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0;
            }
            .container { 
                width: 100%; 
                max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.6;
            }
            .welcome-box { 
                background: #f8faff; 
                padding: 20px; 
                margin: 20px 0; 
                border-left: 4px solid #667eea;
            }
            .button { 
                display: inline-block; 
                padding: 15px 30px; 
                background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
                font-weight: 600;
                font-size: 16px;
                max-width: 100%;
                box-sizing: border-box;
                word-wrap: break-word;
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #666;
            }
            .logo { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
            }
            .feature-list { 
                list-style: none; 
                padding: 0; 
                margin: 20px 0;
            }
            .feature-list li { 
                padding: 10px 0; 
                font-size: 16px;
            }
            .feature-list li:before { 
                content: "✓"; 
                color: #10b981; 
                font-weight: bold; 
                margin-right: 10px; 
                font-size: 16px;
            }
            .highlight { 
                color: #667eea; 
                font-weight: bold;
            }
            @media only screen and (max-width: 600px) {
                .button {
                    display: block;
                    text-align: center;
                    width: calc(100% - 40px);
                    max-width: 280px;
                    margin: 20px auto;
                    padding: 12px 20px;
                    font-size: 15px;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 25px 15px;
                }
            }
            .tips-box {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .tips-list {
                margin: 15px 0;
                padding-left: 0;
            }
            .tips-list li {
                margin: 10px 0;
            }
            @media only screen and (max-width: 600px) {
                .container { 
                    max-width: 95% !important; 
                    margin: 10px auto !important;
                }
                .header, .content { 
                    padding: 25px 20px !important; 
                }
                .footer { 
                    padding: 20px !important; 
                }
                .welcome-box {
                    padding: 20px !important;
                }
                .button {
                    padding: 14px 30px !important;
                    font-size: 15px !important;
                    display: block !important;
                    text-align: center !important;
                    width: fit-content !important;
                    margin: 20px auto !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎯 TaskNest</div>
                    <h1 style="margin: 0; font-size: 36px;">Welcome Aboard!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your project management journey starts here</p>
                </div>
                <div class="content">
                    <div class="welcome-box">
                        <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                        <p style="font-size: 17px; margin-bottom: 20px;">Congratulations on joining TaskNest! We're excited to help you and your team achieve more together.</p>
                        
                        <p style="font-size: 16px;">You now have access to all the powerful features that will help you manage projects efficiently:</p>
                        
                        <ul class="feature-list">
                            <li><strong>Project Management:</strong> Create and organize projects with ease</li>
                            <li><strong>Team Collaboration:</strong> Invite team members and work together seamlessly</li>
                            <li><strong>Task Tracking:</strong> Monitor progress and stay on schedule</li>
                            <li><strong>Real-time Updates:</strong> Get notified about important changes instantly</li>
                            <li><strong>File Management:</strong> Share and organize project files securely</li>
                            <li><strong>Reporting & Analytics:</strong> Track your team's productivity and insights</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">🚀 Get Started Now</a>
                    </div>
                    
                    <div class="tips-box">
                        <h3 style="color: #0369a1; margin-top: 0;">💡 Quick Start Tips:</h3>
                        <ol class="tips-list" style="color: #374151;">
                            <li><strong>Complete your profile</strong> - Add your details and profile picture to help your team recognize you</li>
                            <li><strong>Create your first project</strong> - Start organizing your work and set up your workflow</li>
                            <li><strong>Invite your team</strong> - Collaboration makes everything better and more efficient</li>
                            <li><strong>Explore features</strong> - Take a tour of all the powerful tools at your disposal</li>
                            <li><strong>Set up notifications</strong> - Stay informed about what matters most to you</li>
                        </ol>
                    </div>
                    
                    <div style="background: #fef7ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0; color: #7c3aed;"><strong>🆘 Need Help?</strong> Check out our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/help" style="color: #7c3aed; text-decoration: underline;">Getting Started Guide</a> or contact our support team anytime.</p>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 16px;">We're here to help you succeed and make project management a breeze!</p>
                    <p style="font-weight: 600; color: #374151;"><strong>The TaskNest Team 🌟</strong></p>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0 0 5px 0;">This email was sent to ${email}</p>
                    <p style="margin: 0;">You can update your email preferences in your account settings.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Generate project milestone completion email template
  generateMilestoneCompletionTemplate({ userName, milestoneTitle, projectName, completedBy, email, projectId }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Milestone Completed</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .email-wrapper { 
                width: 100%; 
                padding: 20px 0; 
                background-color: #f5f5f5;
            }
            .container { 
                width: 100%; max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                background: #ffffff; 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.7;
            }
            .milestone-box { 
                background: #f0fdf4; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 12px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                border-left: 4px solid #10B981;
            }
            .button { 
                display: inline-block; 
                padding: 16px 40px; 
                background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 25px 0; 
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s ease;
            }
            .button:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #6c757d; 
                
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 15px;
            }
            .highlight { 
                color: #10B981; 
                font-weight: bold; 
            }
            .celebration { 
                font-size: 48px; 
                margin: 20px 0; 
            }
            .milestone-details {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            @media only screen and (max-width: 600px) {
                .container { 
                    max-width: 95% !important; 
                    margin: 10px auto !important;
                }
                .header, .content { 
                    padding: 25px 20px !important; 
                }
                .footer { 
                    padding: 20px !important; 
                }
                .milestone-box {
                    padding: 20px !important;
                }
                .button {
                    padding: 14px 30px !important;
                    font-size: 15px !important;
                    display: block !important;
                    text-align: center !important;
                    width: fit-content !important;
                    margin: 20px auto !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
                <div class="header">
                    <div class="logo">🎯 TaskNest</div>
                    <h1 style="margin: 0; font-size: 32px;">Milestone Completed!</h1>
                    <div class="celebration">🎉🎯🎉</div>
                    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Celebrating your team's achievement</p>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                    <p style="font-size: 17px; margin-bottom: 20px;">Great news! A milestone has been completed in your project.</p>
                    
                    <div class="milestone-details">
                        <h3 style="color: #065F46; margin: 0 0 15px 0; font-size: 20px;">📋 Milestone Details:</h3>
                        <p style="margin: 10px 0;"><strong>Milestone:</strong> <span class="highlight">${milestoneTitle}</span></p>
                        <p style="margin: 10px 0;"><strong>Project:</strong> ${projectName}</p>
                        <p style="margin: 10px 0;"><strong>Completed by:</strong> ${completedBy}</p>
                        <p style="margin: 10px 0;"><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="milestone-box">
                        <p style="font-size: 16px; margin: 0; text-align: center;">🚀 This milestone completion brings your team one step closer to project success! Each achievement is a testament to your team's dedication and hard work.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${projectId}" class="button">📊 View Project Progress</a>
                    </div>
                    
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <p style="margin: 0; color: #047857;"><strong>🌟 Keep it up!</strong> Your team is making excellent progress and setting a great example of collaboration and efficiency.</p>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0;">This email was sent to ${email}</p>
                </div>
            </div>
    </body>
    </html>
    `;
  }

  // Generate team member added email template
  generateTeamMemberAddedTemplate({ userName, projectName, newMemberName, addedBy, email, projectId }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Team Member Added</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .email-wrapper { 
                width: 100%; 
                padding: 20px 0; 
                background-color: #f5f5f5;
            }
            .container { 
                width: 100%; max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                background: #ffffff; 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.7;
            }
            .member-box { 
                background: #eff6ff; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 12px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                border-left: 4px solid #3B82F6;
            }
            .button { 
                display: inline-block; 
                padding: 16px 40px; 
                background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 25px 0; 
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s ease;
            }
            .button:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #6c757d; 
                
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 15px;
            }
            .highlight { 
                color: #3B82F6; 
                font-weight: bold; 
            }
            .member-details {
                background: #dbeafe;
                border: 1px solid #93c5fd;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            @media only screen and (max-width: 600px) {
                .container { 
                    max-width: 95% !important; 
                    margin: 10px auto !important;
                }
                .header, .content { 
                    padding: 25px 20px !important; 
                }
                .footer { 
                    padding: 20px !important; 
                }
                .member-box {
                    padding: 20px !important;
                }
                .button {
                    padding: 14px 30px !important;
                    font-size: 15px !important;
                    display: block !important;
                    text-align: center !important;
                    width: fit-content !important;
                    margin: 20px auto !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
                <div class="header">
                    <div class="logo">👥 TaskNest</div>
                    <h1 style="margin: 0; font-size: 32px;">New Team Member Added!</h1>
                    <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Your team is growing stronger</p>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                    <p style="font-size: 17px; margin-bottom: 20px;">A new team member has been added to your project.</p>
                    
                    <div class="member-details">
                        <h3 style="color: #1E40AF; margin: 0 0 15px 0; font-size: 20px;">👤 New Member Details:</h3>
                        <p style="margin: 10px 0;"><strong>New Member:</strong> <span class="highlight">${newMemberName}</span></p>
                        <p style="margin: 10px 0;"><strong>Project:</strong> ${projectName}</p>
                        <p style="margin: 10px 0;"><strong>Added by:</strong> ${addedBy}</p>
                        <p style="margin: 10px 0;"><strong>Added on:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="member-box">
                        <p style="font-size: 16px; margin: 0; text-align: center;">🤝 Welcome ${newMemberName} to the team! Make sure to introduce yourself and help them get started on the project. Together, you'll achieve amazing things!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${projectId}" class="button">👥 View Project Team</a>
                    </div>
                    
                    <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <p style="margin: 0; color: #1e40af;"><strong>🌟 Remember:</strong> Great teams make great projects. Let's achieve amazing things together and show our new member what awesome collaboration looks like!</p>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0;">This email was sent to ${email}</p>
                </div>
            </div>
    </body>
    </html>
    `;
  }

  // Generate project completion email template
  generateProjectCompletionTemplate({ userName, projectName, completedBy, projectStats, email, projectId }) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Completed</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .email-wrapper { 
                width: 100%; 
                padding: 20px 0; 
                background-color: #f5f5f5;
            }
            .container { 
                width: 100%; max-width: 100%;
            }
            .header { 
                background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .content { 
                background: #ffffff; 
                padding: 30px 20px; 
                font-size: 16px;
                line-height: 1.7;
            }
            .completion-box { 
                background: #faf5ff; 
                padding: 20px; 
                margin: 25px 0; 
                border-radius: 12px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
                border-left: 4px solid #7C3AED;
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
                gap: 20px; 
                margin: 25px 0; 
            }
            .stat-card { 
                background: #f8fafc; 
                padding: 20px; 
                border-radius: 12px; 
                text-align: center; 
                border: 1px solid #e2e8f0;
                transition: transform 0.2s ease;
            }
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .stat-number { 
                font-size: 28px; 
                font-weight: bold; 
                color: #7C3AED; 
                display: block;
                margin-bottom: 5px;
            }
            .stat-label {
                font-size: 14px;
                color: #6b7280;
                font-weight: 600;
            }
            .button { 
                display: inline-block; 
                padding: 16px 40px; 
                background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 25px 0; 
                font-weight: 600;
                font-size: 16px;
                transition: transform 0.2s ease;
            }
            .button:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 14px; 
                color: #6c757d; 
                
            }
            .logo { 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 15px;
            }
            .highlight { 
                color: #7C3AED; 
                font-weight: bold; 
            }
            .celebration { 
                font-size: 48px; 
                margin: 20px 0; 
            }
            .project-details {
                background: #faf5ff;
                border: 1px solid #e9d5ff;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
            }
            .next-steps {
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                padding: 20px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: center;
            }
            @media only screen and (max-width: 600px) {
                .container { 
                    max-width: 95% !important; 
                    margin: 10px auto !important;
                }
                .header, .content { 
                    padding: 25px 20px !important; 
                }
                .footer { 
                    padding: 20px !important; 
                }
                .completion-box {
                    padding: 20px !important;
                }
                .stats-grid {
                    grid-template-columns: 1fr !important;
                    gap: 15px !important;
                }
                .button {
                    padding: 14px 30px !important;
                    font-size: 15px !important;
                    display: block !important;
                    text-align: center !important;
                    width: fit-content !important;
                    margin: 20px auto !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
                <div class="header">
                    <div class="logo">🏆 TaskNest</div>
                    <h1 style="margin: 0; font-size: 36px;">Project Completed!</h1>
                    <div class="celebration">🎉🏆🎊</div>
                    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Congratulations on this amazing achievement!</p>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi ${userName || 'there'}! 👋</h2>
                    <p style="font-size: 17px; margin-bottom: 20px;">Fantastic news! Your project has been successfully completed.</p>
                    
                    <div class="project-details">
                        <h3 style="color: #581C87; margin: 0 0 15px 0; font-size: 20px;">🎯 Project Details:</h3>
                        <p style="margin: 10px 0;"><strong>Project:</strong> <span class="highlight">${projectName}</span></p>
                        <p style="margin: 10px 0;"><strong>Completed by:</strong> ${completedBy}</p>
                        <p style="margin: 10px 0;"><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    ${projectStats ? `
                    <div style="margin: 30px 0;">
                        <h3 style="color: #374151; text-align: center; margin-bottom: 20px;">📊 Project Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-number">${projectStats.totalTasks || 0}</span>
                                <div class="stat-label">Total Tasks</div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">${projectStats.teamMembers || 0}</span>
                                <div class="stat-label">Team Members</div>
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">${projectStats.duration || 0}</span>
                                <div class="stat-label">Days Duration</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="completion-box">
                        <p style="font-size: 16px; margin: 0; text-align: center;">🚀 This is a significant milestone for your team! The dedication, hard work, and collaboration that went into this project have paid off beautifully.</p>
                    </div>
                    
                    <div class="next-steps">
                        <h4 style="color: #1E40AF; margin: 0 0 10px 0;">🌟 What's Next?</h4>
                        <p style="margin: 0;">Take a moment to celebrate this achievement, then get ready for your next exciting challenge!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0; padding: 0 10px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${projectId}" class="button">📋 View Project Summary</a>
                    </div>
                    
                    <div style="background: #fef7ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <p style="margin: 0; color: #7c3aed;"><strong>🥳 Congratulations!</strong> Great work from everyone involved. Here's to many more successful projects and continued excellence!</p>
                    </div>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 10px 0; font-weight: 600;">© 2025 TaskNest. All rights reserved.</p>
                    <p style="margin: 0;">This email was sent to ${email}</p>
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
