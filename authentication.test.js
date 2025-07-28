const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4006';
const TEST_USER = {
  email: 'ryan.test@example.com',
  password: 'TestPass123!',
  name: 'Ryan Test User',
  company: 'Test Company'
};

describe('Authentication API Tests', () => {
  beforeAll(async () => {
    // Check if mock server is running
    try {
      await axios.get(BASE_URL);
    } catch (error) {
      throw new Error('Mock server is not running. Please run: npm run start:mock');
    }
  });

  describe('User Registration', () => {
    test('should register user with valid data', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
        company: TEST_USER.company
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email', TEST_USER.email);
      expect(response.data).toHaveProperty('name', TEST_USER.name);
      expect(response.data).not.toHaveProperty('password'); // Security check
    });

    test('should fail registration when password is missing', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/register`, {
          email: 'missing.password@test.com',
          name: 'Test User',
          company: 'Test Co'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('message', 'Email and password required');
      }
    });

    test('should handle duplicate email registration', async () => {
      // First registration
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'duplicate@test.com',
        password: 'TestPass123!',
        name: 'First User',
        company: 'First Co'
      });

      // Second registration with same email
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'duplicate@test.com',
        password: 'DifferentPass123!',
        name: 'Second User',
        company: 'Second Co'
      });

      // Note: Mock server allows duplicates, but production should prevent this
      expect(response.status).toBe(201);
      // In production, this should be 409 Conflict
    });

    test('should handle invalid email format', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'not-an-email',
        password: 'TestPass123!',
        name: 'Test User',
        company: 'Test Co'
      });

      // Note: Mock server accepts invalid emails, but production should validate
      expect(response.status).toBe(201);
      // In production, this should be 400 Bad Request
    });
  });

  describe('User Login', () => {
    beforeAll(async () => {
      // Ensure test user exists
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'login.test@example.com',
        password: 'LoginTest123!',
        name: 'Login Test User',
        company: 'Login Test Co'
      });
    });

    test('should login with valid credentials', async () => {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'login.test@example.com',
        password: 'LoginTest123!'
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('token_type', 'bearer');
      expect(typeof response.data.access_token).toBe('string');
    });

    test('should fail login with wrong password', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'login.test@example.com',
          password: 'WrongPassword'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
      }
    });

    test('should fail login with non-existent email', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('message', 'Invalid credentials');
      }
    });

    test('should fail login with missing password', async () => {
      try {
        await axios.post(`${BASE_URL}/api/auth/login`, {
          email: 'login.test@example.com'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('message', 'Email and password required');
      }
    });
  });
});
