# TaskNest Project Details Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for connecting all 7 widgets in the Project Details page to the backend with proper role-based access control and real-time functionality.

## Project Details Page Component Analysis

### Current Widget Structure
The ProjectDetails page contains 7 main widgets:

1. **ProjectOverviewWidget** - Project information, progress, metrics
2. **TaskManagementWidget** - Task board/list with CRUD operations
3. **TeamManagementWidget** - Member management, roles, invitations
4. **CommunicationWidget** - Discussions, chat, activity feed
5. **MilestonesWidget** - Project milestones and timeline
6. **NotificationWidget** - Project notifications and preferences
7. **FilesWidget** - File management (TO BE IMPLEMENTED LATER)

### Role-Based Access Control System
- **Supervisor**: Full project control (create, edit, delete project, manage all members, all permissions)
- **Team Lead**: Project management (edit project, manage team members, assign tasks, create milestones)
- **Team Member**: Basic access (view project, create/edit assigned tasks, participate in discussions)

## Implementation Roadmap

### Phase 1: Backend API Enhancement (Days 1-2)

#### 1.1 Project Overview Widget Backend
**Existing APIs to enhance:**
- `GET /api/v1/projects/:id` - Add progress calculation
- `PUT /api/v1/projects/:id` - Update project details
- `GET /api/v1/projects/:id/stats` - Project statistics

**New APIs needed:**
- `GET /api/v1/projects/:id/progress` - Real-time progress calculation
- `PUT /api/v1/projects/:id/status` - Update project status

#### 1.2 Task Management Widget Backend
**Existing APIs to enhance:**
- `GET /api/v1/projects/:projectId/tasks` - Add filtering, sorting
- `POST /api/v1/projects/:projectId/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

**New APIs needed:**
- `PUT /api/v1/tasks/:id/status` - Quick status updates
- `POST /api/v1/tasks/bulk-update` - Bulk operations
- `GET /api/v1/tasks/:id/comments` - Task comments
- `POST /api/v1/tasks/:id/comments` - Add task comment

#### 1.3 Team Management Widget Backend
**New APIs needed:**
- `POST /api/v1/projects/:id/invite` - Invite team member
- `PUT /api/v1/projects/:id/members/:memberId/role` - Change member role
- `DELETE /api/v1/projects/:id/members/:memberId` - Remove member
- `GET /api/v1/projects/:id/members` - Get team members with details

#### 1.4 Communication Widget Backend
**Existing APIs to enhance:**
- `GET /api/v1/projects/:id/discussions` - Get discussions
- `POST /api/v1/projects/:id/discussions` - Create discussion

**New APIs needed:**
- `POST /api/v1/discussions/:id/replies` - Reply to discussion
- `PUT /api/v1/discussions/:id/pin` - Pin/unpin discussion
- `GET /api/v1/projects/:id/activity` - Activity feed
- `GET /api/v1/projects/:id/messages` - Real-time chat messages
- `POST /api/v1/projects/:id/messages` - Send chat message

#### 1.5 Milestones Widget Backend
**New APIs needed:**
- `GET /api/v1/projects/:id/milestones` - Get project milestones
- `POST /api/v1/projects/:id/milestones` - Create milestone
- `PUT /api/v1/milestones/:id` - Update milestone
- `DELETE /api/v1/milestones/:id` - Delete milestone
- `PUT /api/v1/milestones/:id/status` - Update milestone status

#### 1.6 Notification Widget Backend
**Existing APIs to enhance:**
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read

**New APIs needed:**
- `GET /api/v1/projects/:id/notifications` - Project-specific notifications
- `PUT /api/v1/notifications/mark-all-read` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `PUT /api/v1/users/:id/notification-preferences` - Update preferences

### Phase 2: Database Schema Updates (Day 1)

#### 2.1 Project Model Enhancements
```javascript
// Add to existing project schema
milestones: [{
  title: String,
  description: String,
  dueDate: Date,
  status: {
    type: String,
    enum: ['upcoming', 'in-progress', 'completed', 'overdue'],
    default: 'upcoming'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliverables: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}],
activityLog: [{
  action: String,
  description: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}]
```

#### 2.2 New Message Model
```javascript
const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['message', 'system', 'file', 'mention'],
    default: 'message'
  },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attachments: [String],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

#### 2.3 Enhanced User Model
```javascript
// Add to existing user schema
notificationPreferences: {
  email: {
    taskAssigned: { type: Boolean, default: true },
    taskCompleted: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: true },
    milestoneReminders: { type: Boolean, default: true },
    teamMessages: { type: Boolean, default: false },
    weeklyDigest: { type: Boolean, default: true }
  },
  push: {
    taskAssigned: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    projectUpdates: { type: Boolean, default: false },
    realTimeMessages: { type: Boolean, default: true }
  }
}
```

### Phase 3: Frontend Service Layer (Day 2)

#### 3.1 Enhanced Project Service
**File: `/frontend/src/services/projectService.js`**
- Add milestone management methods
- Add team management methods
- Add activity feed methods
- Add real-time subscription methods

#### 3.2 New Message Service
**File: `/frontend/src/services/messageService.js`**
- Real-time messaging functionality
- Message CRUD operations
- Typing indicators
- Message reactions and replies

#### 3.3 Enhanced Notification Service
**File: `/frontend/src/services/notificationService.js`**
- Project-specific notifications
- Preference management
- Real-time notification updates

### Phase 4: Widget Implementation (Days 3-4)

#### 4.1 ProjectOverviewWidget Implementation
**Features to implement:**
- Real-time progress updates
- Project status changes
- Team metrics
- Recent activity preview
- Permission-based edit controls

#### 4.2 TaskManagementWidget Implementation
**Features to implement:**
- Drag & drop task status updates
- Real-time task updates
- Task filtering and sorting
- Bulk task operations
- Task comments system
- Permission-based CRUD operations

#### 4.3 TeamManagementWidget Implementation
**Features to implement:**
- Member invitation system
- Role management (with permissions)
- Member removal
- Online status indicators
- Member search and filtering

#### 4.4 CommunicationWidget Implementation
**Features to implement:**
- Real-time discussion updates
- Chat messaging with Socket.IO
- Activity feed with real-time updates
- @mentions functionality
- Typing indicators
- Message reactions

#### 4.5 MilestonesWidget Implementation
**Features to implement:**
- Milestone CRUD operations
- Timeline view with progress
- Status tracking
- Permission-based management
- Milestone notifications

#### 4.6 NotificationWidget Implementation
**Features to implement:**
- Real-time notification updates
- Notification preferences
- Mark as read/unread
- Notification filtering
- Bulk actions

### Phase 5: Real-time Integration (Day 3)

#### 5.1 Socket.IO Event Handlers
**Project Events:**
- `project:updated` - Project details changed
- `project:member_added` - New member joined
- `project:member_removed` - Member left/removed
- `project:member_role_changed` - Role updated

**Task Events:**
- `task:created` - New task created
- `task:updated` - Task modified
- `task:status_changed` - Task status updated
- `task:assigned` - Task assignment changed
- `task:comment_added` - New task comment

**Communication Events:**
- `message:sent` - New chat message
- `discussion:created` - New discussion started
- `discussion:replied` - Discussion reply added
- `user:typing` - User typing indicator
- `user:stop_typing` - Stop typing indicator

**Milestone Events:**
- `milestone:created` - New milestone added
- `milestone:updated` - Milestone modified
- `milestone:completed` - Milestone reached

**Notification Events:**
- `notification:new` - New notification
- `notification:read` - Notification marked as read

#### 5.2 Frontend Socket Integration
**Context Updates:**
- Enhance SocketContext for project-specific rooms
- Add event listeners for all widget events
- Implement connection status indicators
- Add offline support with message queuing

### Phase 6: Permission System Integration (Day 4)

#### 6.1 Role-Based Permission Matrix
```javascript
const PERMISSIONS = {
  supervisor: {
    // Project management
    canEditProject: true,
    canDeleteProject: true,
    canChangeProjectStatus: true,
    
    // Team management
    canInviteMembers: true,
    canRemoveMembers: true,
    canChangeRoles: true,
    
    // Task management
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteTasks: true,
    canAssignTasks: true,
    
    // Communication
    canCreateDiscussions: true,
    canPinDiscussions: true,
    canDeleteMessages: true,
    
    // Milestones
    canCreateMilestones: true,
    canEditMilestones: true,
    canDeleteMilestones: true,
    
    // Notifications
    canManageNotifications: true
  },
  teamLead: {
    // Project management
    canEditProject: true,
    canDeleteProject: false,
    canChangeProjectStatus: false,
    
    // Team management
    canInviteMembers: true,
    canRemoveMembers: false,
    canChangeRoles: false,
    
    // Task management
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteTasks: false,
    canAssignTasks: true,
    
    // Communication
    canCreateDiscussions: true,
    canPinDiscussions: true,
    canDeleteMessages: false,
    
    // Milestones
    canCreateMilestones: true,
    canEditMilestones: true,
    canDeleteMilestones: false,
    
    // Notifications
    canManageNotifications: false
  },
  teamMember: {
    // Project management
    canEditProject: false,
    canDeleteProject: false,
    canChangeProjectStatus: false,
    
    // Team management
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    
    // Task management
    canCreateTasks: true,
    canEditAllTasks: false,
    canEditOwnTasks: true,
    canDeleteTasks: false,
    canAssignTasks: false,
    
    // Communication
    canCreateDiscussions: true,
    canPinDiscussions: false,
    canDeleteMessages: false,
    
    // Milestones
    canCreateMilestones: false,
    canEditMilestones: false,
    canDeleteMilestones: false,
    
    // Notifications
    canManageNotifications: false
  }
};
```

#### 6.2 Permission Hooks
**Custom Hook: `useProjectPermissions`**
```javascript
const useProjectPermissions = (project, user) => {
  const getUserRole = () => {
    const member = project?.members?.find(m => m.user._id === user.id);
    return member?.role || 'teamMember';
  };
  
  const hasPermission = (permission) => {
    const role = getUserRole();
    return PERMISSIONS[role]?.[permission] || false;
  };
  
  return { getUserRole, hasPermission, userRole: getUserRole() };
};
```

### Phase 7: Testing & Integration (Day 5)

#### 7.1 Widget Integration Testing
- Test all widgets individually
- Test real-time functionality
- Test permission enforcement
- Test error handling

#### 7.2 Cross-widget Communication
- Test data consistency across widgets
- Test real-time updates propagation
- Test socket connection management

#### 7.3 Performance Testing
- Test with multiple concurrent users
- Test real-time performance
- Test data loading performance

### Phase 8: Final Implementation (Days 6-7)

#### 8.1 Error Handling & Loading States
- Add comprehensive error boundaries
- Implement loading skeletons
- Add retry mechanisms

#### 8.2 UI/UX Polish
- Consistent styling across widgets
- Responsive design verification
- Accessibility improvements

#### 8.3 Documentation & Deployment
- API documentation updates
- Component documentation
- Deployment preparation

## Success Criteria

### Functional Requirements
- ✅ All 7 widgets fully functional
- ✅ Role-based access control enforced
- ✅ Real-time updates working
- ✅ Data consistency maintained
- ✅ Error handling implemented

### Performance Requirements
- ✅ Page load time < 3 seconds
- ✅ Real-time updates < 1 second latency
- ✅ Smooth UI interactions
- ✅ Mobile responsiveness

### Security Requirements
- ✅ Permission validation on backend
- ✅ Input sanitization
- ✅ XSS protection
- ✅ CSRF protection

## Risk Mitigation

### Technical Risks
- **Complex real-time synchronization**: Implement proper event ordering and conflict resolution
- **Performance with multiple widgets**: Optimize queries and implement proper caching
- **Permission complexity**: Thorough testing of all permission combinations

### Timeline Risks
- **Backend API development**: Prioritize most critical APIs first
- **Socket.IO integration**: Start with basic events, add complexity gradually
- **Testing time**: Implement testing in parallel with development

## Next Steps

1. **Day 1**: Start with backend API enhancements for Project Overview and Task Management
2. **Day 2**: Continue with Team Management and Communication APIs
3. **Day 3**: Implement Milestones and Notifications, start real-time integration
4. **Day 4**: Complete all widgets with full functionality
5. **Day 5**: Testing and bug fixes
6. **Day 6-7**: Polish, documentation, and deployment preparation

This implementation plan ensures systematic development of all widget functionalities with proper role-based access control and real-time capabilities.
