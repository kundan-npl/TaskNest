/**
 * Socket.IO Real-time Test Script
 * Tests all Socket.IO events and widget integrations
 */

require('dotenv').config();
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

class SocketTester {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.receivedEvents = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      // Generate a test JWT token with a real user ID
      const jwtSecret = process.env.JWT_SECRET || 'J/jEY3DrDFY0kw4GgqMC6x8Y9wfMTo6UiesfkmfgB0M=';
      console.log('Using JWT secret:', jwtSecret ? 'Found' : 'Missing');
      
      const testToken = jwt.sign(
        { id: '68308aa35963063c4a857eed' }, // Using existing user ID
        jwtSecret,
        { expiresIn: '1h' }
      );

      this.socket = io('http://localhost:5500', {
        auth: {
          token: testToken
        },
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected:', this.socket.id);
        this.connected = true;
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('⚠️  Socket disconnected');
        this.connected = false;
      });
    });
  }

  setupEventListeners() {
    // Test all widget-related events
    const eventTypes = [
      'task_status_changed',
      'new_task_comment',
      'member_update',
      'project_notification',
      'milestone_update',
      'dashboard_update',
      'notification',
      'userJoinedProject',
      'userLeftProject',
      'userTyping',
      'userStoppedTyping'
    ];

    eventTypes.forEach(eventType => {
      this.socket.on(eventType, (data) => {
        console.log(`📡 Received ${eventType}:`, data);
        this.receivedEvents.push({
          type: eventType,
          data,
          timestamp: new Date()
        });
      });
    });
  }

  async testProjectRoom(projectId) {
    if (!this.connected) {
      throw new Error('Socket not connected');
    }

    console.log(`🏠 Joining project room: ${projectId}`);
    this.socket.emit('join_project', { projectId });

    // Simulate user activity
    this.socket.emit('user_typing', {
      projectId,
      userId: 'test-user',
      userName: 'Test User'
    });

    setTimeout(() => {
      this.socket.emit('user_stopped_typing', {
        projectId,
        userId: 'test-user'
      });
    }, 2000);
  }

  async testTaskEvents(projectId) {
    console.log('🔄 Testing task events...');
    
    // Simulate task status change
    this.socket.emit('task_update', {
      projectId,
      taskId: 'test-task-123',
      type: 'status_changed',
      status: 'completed',
      updatedBy: 'test-user'
    });
  }

  async testNotificationEvents(projectId) {
    console.log('🔔 Testing notification events...');
    
    this.socket.emit('send_notification', {
      projectId,
      type: 'task_assigned',
      message: 'New task has been assigned to you',
      recipientId: 'test-user'
    });
  }

  async runComprehensiveTest() {
    try {
      console.log('🚀 Starting Socket.IO Comprehensive Test\n');

      // Connect to server
      await this.connect();
      
      // Test with a mock project ID
      const testProjectId = '683b38390fa7c68da90cf297';
      
      // Test project room functionality
      await this.testProjectRoom(testProjectId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test task events
      await this.testTaskEvents(testProjectId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test notification events
      await this.testNotificationEvents(testProjectId);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show results
      console.log('\n📊 Test Results:');
      console.log(`Events received: ${this.receivedEvents.length}`);
      
      if (this.receivedEvents.length > 0) {
        console.log('✅ Socket.IO is working correctly!');
        this.receivedEvents.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.type} at ${event.timestamp.toISOString()}`);
        });
      } else {
        console.log('⚠️  No events received - check server implementation');
      }

    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new SocketTester();
  tester.runComprehensiveTest().then(() => {
    console.log('\n🏁 Socket.IO test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = SocketTester;
