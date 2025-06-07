#!/usr/bin/env node

/**
 * Enhanced Test Data Creation Script
 * Creates comprehensive test data to address all widget testing requirements
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const Milestone = require('./src/models/milestone.model');

async function createEnhancedTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing test data thoroughly
    await User.deleteMany({ email: { $regex: /@testwidget\.com$/i } });
    await Project.deleteMany({ title: /Widget Test/i });
    await Task.deleteMany({ title: /Widget Test|Critical UI|Security|Performance|Documentation|Refactor|Polish|API Integration|Mobile/i });
    await Milestone.deleteMany({ title: /Phase|Widget Test/i });

    console.log('🧹 Cleaned existing test data thoroughly');

    // Create enhanced test users with different roles
    const users = await User.create([
      {
        name: 'Widget Supervisor Alice',
        email: 'supervisor@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'Project supervisor with full access permissions',
          skills: ['Project Management', 'Team Leadership', 'Strategic Planning']
        }
      },
      {
        name: 'Widget Team Lead Bob',
        email: 'teamlead@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'Experienced team lead managing development activities',
          skills: ['Team Management', 'Development', 'Quality Assurance']
        }
      },
      {
        name: 'Widget Senior Dev Carol',
        email: 'senior-dev@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'Senior developer with advanced permissions',
          skills: ['Full-Stack Development', 'Architecture', 'Mentoring']
        }
      },
      {
        name: 'Widget Developer Dave',
        email: 'developer@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'Mid-level developer working on various features',
          skills: ['Frontend Development', 'Backend Development', 'Testing']
        }
      },
      {
        name: 'Widget Tester Eve',
        email: 'tester@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'QA tester with limited read-only permissions',
          skills: ['Manual Testing', 'Bug Reporting', 'Quality Assurance']
        }
      },
      {
        name: 'Widget Observer Frank',
        email: 'observer@testwidget.com',
        password: 'password123',
        systemRole: 'user',
        profile: {
          bio: 'Project observer with read-only access',
          skills: ['Documentation', 'Process Analysis', 'Reporting']
        }
      }
    ]);

    console.log('👥 Created enhanced test users with diverse roles');

    // Create comprehensive test project with rich data
    const project = await Project.create({
      title: 'Widget Test Project - Enhanced Edition',
      description: 'Comprehensive test project with enhanced role diversity, multiple priority levels, various statuses, and rich data for thorough widget testing',
      status: 'active',
      createdBy: users[0]._id,
      startDate: new Date('2024-01-15'),
      deadline: new Date('2024-06-30'),
      members: [
        { user: users[0]._id, role: 'supervisor', joinedAt: new Date('2024-01-15') },
        { user: users[1]._id, role: 'team-lead', joinedAt: new Date('2024-01-16') },
        { user: users[2]._id, role: 'team-lead', joinedAt: new Date('2024-01-17') },
        { user: users[3]._id, role: 'team-member', joinedAt: new Date('2024-01-18') },
        { user: users[4]._id, role: 'team-member', joinedAt: new Date('2024-01-19') },
        { user: users[5]._id, role: 'team-member', joinedAt: new Date('2024-01-20') }
      ]
    });

    console.log('📋 Created enhanced comprehensive test project');

    // Create extensive tasks with all priorities and statuses
    const tasks = await Task.create([
      // URGENT PRIORITY TASKS
      {
        title: 'Critical Security Vulnerability Fix',
        description: 'Immediate fix required for security vulnerability in authentication system',
        status: 'in-progress',
        priority: 'urgent',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[1]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
        estimatedHours: 8,
        tags: ['security', 'critical', 'hotfix']
      },
      {
        title: 'Production Server Down Emergency',
        description: 'Emergency response to production server outage',
        status: 'todo',
        priority: 'urgent',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000), // 12 hours
        estimatedHours: 4,
        tags: ['emergency', 'production', 'infrastructure']
      },

      // HIGH PRIORITY TASKS
      {
        title: 'Critical UI Bug Affecting User Login',
        description: 'Fix critical user interface bug that prevents users from logging in',
        status: 'in-progress',
        priority: 'high',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        estimatedHours: 12,
        tags: ['ui', 'login', 'user-experience']
      },
      {
        title: 'Database Performance Optimization',
        description: 'Optimize database queries to improve application performance',
        status: 'done',
        priority: 'high',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        estimatedHours: 16,
        completedAt: new Date(),
        tags: ['database', 'performance', 'optimization']
      },
      {
        title: 'API Security Enhancement',
        description: 'Implement additional security measures for API endpoints',
        status: 'todo',
        priority: 'high',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        estimatedHours: 20,
        tags: ['api', 'security', 'authentication']
      },

      // MEDIUM PRIORITY TASKS
      {
        title: 'User Dashboard Redesign',
        description: 'Redesign user dashboard for better user experience',
        status: 'in-progress',
        priority: 'medium',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        estimatedHours: 24,
        tags: ['ui', 'dashboard', 'redesign']
      },
      {
        title: 'Mobile Responsiveness Implementation',
        description: 'Make the application fully responsive for mobile devices',
        status: 'todo',
        priority: 'medium',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        estimatedHours: 18,
        tags: ['mobile', 'responsive', 'css']
      },
      {
        title: 'Integration Testing Suite',
        description: 'Develop comprehensive integration testing suite',
        status: 'done',
        priority: 'medium',
        project: project._id,
        createdBy: users[4]._id,
        assignedTo: [{ user: users[4]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        estimatedHours: 30,
        completedAt: new Date(),
        tags: ['testing', 'integration', 'automation']
      },

      // LOW PRIORITY TASKS
      {
        title: 'Code Documentation Update',
        description: 'Update and improve code documentation',
        status: 'todo',
        priority: 'low',
        project: project._id,
        createdBy: users[2]._id,
        assignedTo: [{ user: users[5]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        estimatedHours: 15,
        tags: ['documentation', 'maintenance']
      },
      {
        title: 'UI Polish and Minor Improvements',
        description: 'Polish user interface with minor styling improvements',
        status: 'in-progress',
        priority: 'low',
        project: project._id,
        createdBy: users[3]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
        estimatedHours: 8,
        tags: ['ui', 'polish', 'styling']
      },
      {
        title: 'Legacy Code Refactoring',
        description: 'Refactor legacy code for better maintainability',
        status: 'done',
        priority: 'low',
        project: project._id,
        createdBy: users[2]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
        estimatedHours: 22,
        completedAt: new Date(),
        tags: ['refactoring', 'maintenance', 'code-quality']
      }
    ]);

    console.log('✅ Created comprehensive tasks with all priority levels and statuses');

    // Create comprehensive milestones
    const milestones = await Milestone.create([
      {
        title: 'Phase 1: Foundation & Security',
        description: 'Complete foundational features and security implementations',
        status: 'completed',
        priority: 'urgent',
        dueDate: new Date('2024-02-15'),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[0]._id, users[1]._id, users[2]._id],
        progress: 100,
        tags: ['foundation', 'security']
      },
      {
        title: 'Phase 2: Core Development',
        description: 'Develop all core functionality and features',
        status: 'completed',
        priority: 'high',
        dueDate: new Date('2024-04-15'),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[1]._id, users[2]._id, users[3]._id],
        progress: 100,
        tags: ['development', 'features']
      },
      {
        title: 'Phase 3: Enhancement & Optimization',
        description: 'Enhance features and optimize performance',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2024-05-15'),
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [users[2]._id, users[3]._id],
        progress: 75,
        tags: ['enhancement', 'optimization']
      },
      {
        title: 'Phase 4: Testing & Quality Assurance',
        description: 'Comprehensive testing and quality assurance',
        status: 'not-started',
        priority: 'medium',
        dueDate: new Date('2024-06-15'),
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [users[4]._id, users[3]._id],
        progress: 25,
        tags: ['testing', 'qa']
      },
      {
        title: 'Phase 5: Deployment & Documentation',
        description: 'Deploy to production and finalize documentation',
        status: 'not-started',
        priority: 'low',
        dueDate: new Date('2024-06-30'),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[0]._id, users[1]._id, users[5]._id],
        progress: 0,
        tags: ['deployment', 'documentation']
      }
    ]);

    console.log('🎯 Created comprehensive milestones with various statuses');

    // Print detailed summary
    console.log('\n📊 ENHANCED TEST DATA SUMMARY:');
    console.log(`Users: ${users.length}`);
    console.log(`Project: 1 (with ${project.members.length} members)`);
    console.log(`Tasks: ${tasks.length}`);
    console.log(`Milestones: ${milestones.length}`);
    
    console.log('\n🏆 DETAILED ROLE DISTRIBUTION:');
    project.members.forEach((member, index) => {
      console.log(`- ${member.role}: ${users[index].name} (${users[index].email})`);
    });

    console.log('\n📈 TASK PRIORITY DISTRIBUTION:');
    const taskPriorityStats = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    Object.entries(taskPriorityStats).forEach(([priority, count]) => {
      console.log(`- ${priority}: ${count} tasks`);
    });

    console.log('\n📊 TASK STATUS DISTRIBUTION:');
    const taskStatusStats = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(taskStatusStats).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} tasks`);
    });

    console.log('\n🎯 MILESTONE STATUS DISTRIBUTION:');
    const milestoneStatusStats = milestones.reduce((acc, milestone) => {
      acc[milestone.status] = (acc[milestone.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(milestoneStatusStats).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} milestones`);
    });

    console.log('\n✅ Enhanced comprehensive test data created successfully!');
    console.log('🔗 Project ID:', project._id);
    console.log('👥 Total Users:', users.length);
    console.log('📋 Total Tasks:', tasks.length);
    console.log('🎯 Total Milestones:', milestones.length);

  } catch (error) {
    console.error('❌ Error creating enhanced test data:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the script
createEnhancedTestData();
