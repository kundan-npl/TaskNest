
const projectController = require('./project.controller');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../models/project.model');
jest.mock('../models/user.model');

// Mock helper functions if they are in separate files and used by acceptInvitation
jest.mock('../services/email.service', () => ({
  isAvailable: jest.fn(() => true),
  sendProjectInvitation: jest.fn().mockResolvedValue({ success: true }),
}));

const mockGetPermissionsForRole = jest.fn((role) => {
  if (role === 'team-member') return { canViewReports: true, canCreateTasks: true };
  if (role === 'supervisor') return { canManageMembers: true, canInviteMembers: true };
  return {}; 
});

// If getPermissionsForRole is part of project.controller.js and not exported for direct mocking,
// you might need to structure your controller to allow easier testing or mock its behavior indirectly.
// For this example, let's assume it can be mocked or its logic is simple enough to be covered by testing acceptInvitation.


describe('Project Controller - acceptInvitation', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Clear all mocks
    Project.findById.mockClear();
    User.findById.mockClear();
    User.findOne.mockClear();
    User.exists.mockClear();
    mockGetPermissionsForRole.mockClear();
    // projectController.getPermissionsForRole = mockGetPermissionsForRole; // If it was a direct export
  });

  const mockProject = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Test Project',
    pendingInvitations: [],
    members: [],
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'testuser@example.com',
    name: 'Test User'
  };

  const mockInvitation = {
    email: 'invited@example.com',
    role: 'team-member',
    token: 'validtoken123',
    status: 'pending',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires tomorrow
    invitedBy: new mongoose.Types.ObjectId(),
  };

  it('should return 400 if projectId is missing', async () => {
    req.params.token = 'validtoken123';
    // req.body.projectId is not set

    await projectController.acceptInvitation(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toBe('Project ID is required in the request body.');
  });

  it('should return 404 if project not found', async () => {
    req.params.token = 'validtoken123';
    req.body.projectId = mockProject._id.toString();
    Project.findById.mockResolvedValue(null);

    await projectController.acceptInvitation(req, res, next);

    expect(Project.findById).toHaveBeenCalledWith(mockProject._id.toString());
    expect(res.statusCode).toBe(404);
    expect(res._getJSONData().error).toBe('Project not found.');
  });

  it('should return 400 if invitation is invalid or not pending', async () => {
    req.params.token = 'invalidtoken';
    req.body.projectId = mockProject._id.toString();
    const projectWithNoMatchingInvite = { ...mockProject, pendingInvitations: [mockInvitation] }; // token won't match
    Project.findById.mockResolvedValue(projectWithNoMatchingInvite);

    await projectController.acceptInvitation(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toMatch(/Invitation is invalid, expired, or already used/);
  });

  it('should return 400 if invitation has expired', async () => {
    req.params.token = mockInvitation.token;
    req.body.projectId = mockProject._id.toString();
    const expiredInvitation = { ...mockInvitation, expiresAt: new Date(Date.now() - 60000) }; // Expired 1 min ago
    const projectWithExpiredInvite = { ...mockProject, pendingInvitations: [expiredInvitation], save: jest.fn().mockResolvedValue(true) }; 
    Project.findById.mockResolvedValue(projectWithExpiredInvite);

    await projectController.acceptInvitation(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toMatch(/Invitation has expired/);
    expect(projectWithExpiredInvite.save).toHaveBeenCalled();
    expect(expiredInvitation.status).toBe('expired');
  });

  describe('When user is NOT authenticated', () => {
    beforeEach(() => {
      req.params.token = mockInvitation.token;
      req.body.projectId = mockProject._id.toString();
      const projectInstance = { ...mockProject, pendingInvitations: [mockInvitation] };
      Project.findById.mockResolvedValue(projectInstance);
      req.user = null; // Explicitly set no authenticated user
    });

    it('should return requiresAuth:true, authMode:register if user does not exist', async () => {
      User.exists.mockResolvedValue(false); // Simulate user not existing

      await projectController.acceptInvitation(req, res, next);

      expect(User.exists).toHaveBeenCalledWith({ email: mockInvitation.email.toLowerCase() });
      expect(res.statusCode).toBe(200);
      const responseData = res._getJSONData().data;
      expect(responseData.requiresAuth).toBe(true);
      expect(responseData.authMode).toBe('register');
      expect(responseData.invitationEmail).toBe(mockInvitation.email);
      expect(responseData.projectName).toBe(mockProject.title);
      expect(responseData.role).toBe(mockInvitation.role);
      expect(responseData.userExists).toBe(false);
    });

    it('should return requiresAuth:true, authMode:login if user exists', async () => {
      User.exists.mockResolvedValue(true); // Simulate user existing

      await projectController.acceptInvitation(req, res, next);

      expect(User.exists).toHaveBeenCalledWith({ email: mockInvitation.email.toLowerCase() });
      expect(res.statusCode).toBe(200);
      const responseData = res._getJSONData().data;
      expect(responseData.requiresAuth).toBe(true);
      expect(responseData.authMode).toBe('login');
      expect(responseData.userExists).toBe(true);
    });
  });

  describe('When user IS authenticated', () => {
    beforeEach(() => {
      req.params.token = mockInvitation.token;
      req.body.projectId = mockProject._id.toString();
      req.user = { id: mockUser._id.toString() }; // Authenticated user
      // Ensure getPermissionsForRole is available in the scope of acceptInvitation
      // This might require exporting it from project.controller or placing it in a shared util
      // For now, we assume it's accessible. If it's internal, this test structure might need adjustment.
      // A common pattern is to have helpers in a separate utils file and mock that.
      // If getPermissionsForRole is directly in project.controller.js, it's harder to mock without refactoring.
      // Let's assume for the test that the controller has access to a working getPermissionsForRole.
      // We will mock the Project and User model methods instead.
    });

    it('should return 401 if authenticated user not found in DB', async () => {
      Project.findById.mockResolvedValue({ ...mockProject, pendingInvitations: [mockInvitation] });
      User.findById.mockResolvedValue(null); // Authenticated user ID, but no user document
      User.exists.mockResolvedValue(false); // For the data block if it reaches there

      await projectController.acceptInvitation(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(mockUser._id.toString());
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().error).toMatch(/Authenticated user not found/);
    });

    it('should return 403 if authenticated user email does not match invitation email', async () => {
      const differentUser = { ...mockUser, email: 'different@example.com', _id: mockUser._id };
      Project.findById.mockResolvedValue({ ...mockProject, pendingInvitations: [mockInvitation] });
      User.findById.mockResolvedValue(differentUser);

      await projectController.acceptInvitation(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().error).toMatch(/This invitation is for invited@example.com/);
      expect(res._getJSONData().data.currentAccount).toBe('different@example.com');
    });

    it('should add user to project and return success if emails match and not already member', async () => {
      const projectInstance = { 
        ...mockProject, 
        pendingInvitations: [{...mockInvitation, email: mockUser.email}], // Align invite email with mockUser
        members: [], 
        save: jest.fn().mockResolvedValue(true)
      };
      Project.findById.mockResolvedValue(projectInstance);
      User.findById.mockResolvedValue(mockUser); // Authenticated user matches invite email
      
      // Mocking the internal getPermissionsForRole is tricky. 
      // The test will rely on the actual implementation within acceptInvitation or assume it works.
      // If it's a separate utility, it should be mocked as shown at the top.
      // For this test, we assume the controller's internal logic for permissions is correct.

      await projectController.acceptInvitation(req, res, next);

      expect(projectInstance.save).toHaveBeenCalled();
      expect(projectInstance.members.length).toBe(1);
      expect(projectInstance.members[0].user.toString()).toBe(mockUser._id.toString());
      expect(projectInstance.members[0].role).toBe(mockInvitation.role);
      expect(projectInstance.pendingInvitations[0].status).toBe('accepted');
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().success).toBe(true);
      expect(res._getJSONData().message).toMatch(/Successfully joined project/);
      expect(res._getJSONData().data.redirectTo).toBe(`/projects/${projectInstance._id}`);
    });

    it('should return success if user is already a member', async () => {
      const projectInstance = { 
        ...mockProject, 
        pendingInvitations: [{...mockInvitation, email: mockUser.email}],
        members: [{ user: mockUser._id, role: 'existing-role' }], // User is already a member
        save: jest.fn().mockResolvedValue(true)
      };
      Project.findById.mockResolvedValue(projectInstance);
      User.findById.mockResolvedValue(mockUser);

      await projectController.acceptInvitation(req, res, next);

      expect(projectInstance.save).toHaveBeenCalled(); // Invitation status should be updated
      expect(projectInstance.pendingInvitations[0].status).toBe('accepted');
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().message).toBe('You are already a member of this project.');
      expect(res._getJSONData().data.role).toBe('existing-role');
    });
  });

  // Test for invalid invitation email structure (e.g. not a string)
  it('should return 500 if invitation email is invalid type', async () => {
    req.params.token = mockInvitation.token;
    req.body.projectId = mockProject._id.toString();
    const invalidEmailInvite = { ...mockInvitation, email: null }; // Invalid email type
    const projectWithInvalidEmail = { ...mockProject, pendingInvitations: [invalidEmailInvite] }; 
    Project.findById.mockResolvedValue(projectWithInvalidEmail);

    await projectController.acceptInvitation(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toBe('Invalid invitation data: Email is missing or invalid.');
  });

  // Test for authenticated user having invalid email structure
  it('should return 500 if authenticated user email is invalid type (when authenticated)', async () => {
    req.params.token = mockInvitation.token;
    req.body.projectId = mockProject._id.toString();
    req.user = { id: mockUser._id.toString() };
    const userWithInvalidEmail = { ...mockUser, email: null }; // User model with invalid email
    
    const projectInstance = { ...mockProject, pendingInvitations: [mockInvitation] }; 
    Project.findById.mockResolvedValue(projectInstance);
    User.findById.mockResolvedValue(userWithInvalidEmail);

    await projectController.acceptInvitation(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toBe('Authenticated user profile is incomplete (missing email).');
  });

});

// You might need to add a similar test suite for inviteMember if it's not already covered.

// Note: To properly mock 'getPermissionsForRole' if it's not exported or easily accessible,
// you might need to use more advanced Jest techniques like jest.spyOn on the module itself if it's a method,
// or refactor the controller to make dependencies more injectable for easier testing.
// The current tests for the authenticated user path assume that getPermissionsForRole works as expected
// or is simple enough not to be the primary source of failure in these specific scenarios.

