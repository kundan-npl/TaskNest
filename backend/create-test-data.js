#!/usr/bin/env node

/**
 * Script to create comprehensive test data for widget testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const Milestone = require('./src/models/milestone.model');

async function createComprehensiveTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing test data
    await User.deleteMany({ email: { $regex: /@testwidget\.com$/i } });
    await Project.deleteMany({ title: /Widget Test/i });

    console.log('🧹 Cleaned existing test data');

    // Create test users with different roles
    const users = await User.create([
      {
        name: 'Widget Supervisor',
        email: 'supervisor@testwidget.com',
        password: 'password123',
        systemRole: 'user'
      },
      {
        name: 'Widget Team Lead',
        email: 'teamlead@testwidget.com',
        password: 'password123',
        systemRole: 'user'
      },
      {
        name: 'Widget Team Member 1',
        email: 'member1@testwidget.com',
        password: 'password123',
        systemRole: 'user'
      },
      {
        name: 'Widget Team Member 2',
        email: 'member2@testwidget.com',
        password: 'password123',
        systemRole: 'user'
      },
      {
        name: 'Widget Team Member 3',
        email: 'member3@testwidget.com',
        password: 'password123',
        systemRole: 'user'
      }
    ]);

    console.log('👥 Created test users');

    // Create comprehensive test project
    const project = await Project.create({
      title: 'Widget Test Project - Complete',
      description: 'Comprehensive project for testing all widget functionality with diverse roles and data',
      status: 'active',
      priorityLevel: 'high',
      createdBy: users[0]._id,
      startDate: new Date(),
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      members: [
        { user: users[0]._id, role: 'supervisor', joinedAt: new Date() },
        { user: users[1]._id, role: 'team-lead', joinedAt: new Date() },
        { user: users[2]._id, role: 'team-member', joinedAt: new Date() },
        { user: users[3]._id, role: 'team-member', joinedAt: new Date() },
        { user: users[4]._id, role: 'team-member', joinedAt: new Date() }
      ]
    });

    console.log('📋 Created comprehensive test project');

    // Create tasks with diverse statuses and priorities
    const tasks = await Task.create([
      // High priority tasks
      {
        title: 'Critical UI Bug Fix',
        description: 'Fix critical user interface bug affecting login',
        status: 'in-progress',
        priority: 'urgent',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[1]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
      },
      {
        title: 'Security Vulnerability Patch',
        description: 'Apply security patches to prevent data breach',
        status: 'todo',
        priority: 'high',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
      },
      // Medium priority tasks
      {
        title: 'Performance Optimization',
        description: 'Optimize database queries for better performance',
        status: 'in-progress',
        priority: 'medium',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
      },
      {
        title: 'User Documentation Update',
        description: 'Update user manual with latest features',
        status: 'done',
        priority: 'medium',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[4]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      // Low priority tasks
      {
        title: 'Code Refactoring',
        description: 'Refactor legacy code for better maintainability',
        status: 'todo',
        priority: 'low',
        project: project._id,
        createdBy: users[2]._id,
        assignedTo: [{ user: users[2]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days
      },
      {
        title: 'UI Polish',
        description: 'Minor UI improvements and styling',
        status: 'done',
        priority: 'low',
        project: project._id,
        createdBy: users[3]._id,
        assignedTo: [{ user: users[4]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days
      },
      // Additional tasks for testing
      {
        title: 'API Integration Testing',
        description: 'Test all API endpoints with different scenarios',
        status: 'in-progress',
        priority: 'high',
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [{ user: users[1]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 8 days
      },
      {
        title: 'Mobile Responsiveness',
        description: 'Ensure application works well on mobile devices',
        status: 'todo',
        priority: 'medium',
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [{ user: users[3]._id, assignedAt: new Date() }],
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) // 12 days
      }
    ]);

    console.log('✅ Created diverse tasks with multiple priorities and statuses');

    // Debug milestone model
    console.log('🔍 Debugging Milestone model...');
    console.log('Milestone type:', typeof Milestone);
    console.log('Milestone.create type:', typeof Milestone.create);

    // Create milestones
    const milestones = await Milestone.create([
      {
        title: 'Phase 1: Core Features',
        description: 'Complete all core functionality',
        status: 'completed',
        priority: 'high',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[0]._id, users[1]._id],
        progress: 100
      },
      {
        title: 'Phase 2: Testing & QA',
        description: 'Comprehensive testing and quality assurance',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[1]._id, users[2]._id],
        progress: 65
      },
      {
        title: 'Phase 3: Performance Optimization',
        description: 'Optimize performance and scalability',
        status: 'not-started',
        priority: 'medium',
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: users[1]._id,
        assignedTo: [users[2]._id, users[3]._id],
        progress: 0
      },
      {
        title: 'Phase 4: Deployment',
        description: 'Deploy to production environment',
        status: 'not-started',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        project: project._id,
        createdBy: users[0]._id,
        assignedTo: [users[0]._id, users[1]._id],
        progress: 0
      }
    ]);

    console.log('🎯 Created comprehensive milestones');

    // Print summary
    console.log('\n📊 TEST DATA SUMMARY:');
    console.log(`Users: ${users.length} (1 supervisor, 1 team-lead, 3 team-members)`);
    console.log(`Project: 1 (with ${project.members.length} members)`);
    console.log(`Tasks: ${tasks.length} (various priorities: urgent, high, medium, low)`);
    console.log(`Milestones: ${milestones.length} (various statuses and priorities)`);
    
    console.log('\n🏆 ROLE DISTRIBUTION:');
    console.log('- Supervisor: Widget Supervisor (supervisor@testwidget.com)');
    console.log('- Team Lead: Widget Team Lead (teamlead@testwidget.com)');
    console.log('- Team Members: 3 members (member1-3@testwidget.com)');

    console.log('\n📈 TASK DISTRIBUTION:');
    const taskStats = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});
    Object.entries(taskStats).forEach(([priority, count]) => {
      console.log(`- ${priority}: ${count} tasks`);
    });

    console.log('\n✅ Comprehensive test data created successfully!');
    console.log('🔗 Project ID:', project._id);
    console.log('👤 Test User IDs:', users.map(u => `${u.name}: ${u._id}`).join(', '));

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Run the script
createComprehensiveTestData();
