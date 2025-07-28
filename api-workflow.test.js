const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4006';

describe('API Workflow Tests', () => {
  let authToken = null;

  beforeAll(async () => {
    // Check if mock server is running
    try {
      await axios.get(BASE_URL);
    } catch (error) {
      throw new Error('Mock server is not running. Please run: npm run start:mock');
    }
  });

  describe('Authentication Workflow', () => {
    test('should register a new user', async () => {
      const userData = {
        email: 'ryan.workflow@test.com',
        password: 'WorkflowTest123!',
        name: 'Ryan Workflow',
        company: 'Workflow Test Co'
      };

      const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.email).toBe(userData.email);
      expect(response.data.name).toBe(userData.name);
    });

    test('should login with registered user', async () => {
      const loginData = {
        email: 'ryan.workflow@test.com',
        password: 'WorkflowTest123!'
      };

      const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('token_type', 'bearer');
      
      // Store token for later tests
      authToken = response.data.access_token;
    });

    test('should reject login with wrong password', async () => {
      const loginData = {
        email: 'ryan.workflow@test.com',
        password: 'WrongPassword'
      };

      try {
        await axios.post(`${BASE_URL}/api/auth/login`, loginData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Invalid credentials');
      }
    });
  });

  describe('Products', () => {
    test('should get available subscription products', async () => {
      const response = await axios.get(`${BASE_URL}/api/products`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('products');
      expect(Array.isArray(response.data.products)).toBe(true);
      expect(response.data.products.length).toBeGreaterThan(0);
      
      // Check first product has required fields
      const product = response.data.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
    });
  });

  describe('Subscription Workflow', () => {
    test('should reject subscription without authorization', async () => {
      const subscriptionData = {
        planId: 'prod_basic',
        paymentMethodId: 'pm_card_visa',
        billingDetails: {
          name: 'Test User',
          email: 'test@example.com',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postal_code: '12345',
            country: 'US'
          }
        }
      };

      try {
        await axios.post(`${BASE_URL}/api/subscriptions`, subscriptionData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Authorization required');
      }
    });

    test('should create subscription with valid authorization', async () => {
      const subscriptionData = {
        planId: 'prod_basic',
        paymentMethodId: 'pm_card_visa',
        billingDetails: {
          name: 'Ryan Workflow',
          email: 'ryan.workflow@test.com',
          address: {
            line1: '123 Business Ave',
            city: 'Business City',
            state: 'BC',
            postal_code: '12345',
            country: 'US'
          }
        }
      };

      const response = await axios.post(`${BASE_URL}/api/subscriptions`, subscriptionData, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('status', 'active');
      expect(response.data).toHaveProperty('planId', 'prod_basic');
    });
  });

  describe('Complete Workflow Test', () => {
    test('should complete full authentication -> products -> subscription flow', async () => {
      // Let's create a new user for testing
      const testUser = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
        company: 'Test Company'
      };

      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
      expect(registerResponse.status).toBe(201);

      // Now, let's log in with the new user
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      expect(loginResponse.status).toBe(200);
      const token = loginResponse.data.access_token;

      // Step 3: Get products
      const productsResponse = await axios.get(`${BASE_URL}/api/products`);
      expect(productsResponse.status).toBe(200);
      expect(productsResponse.data.products.length).toBeGreaterThan(0);

      // Step 4: Create subscription
      const subscriptionResponse = await axios.post(`${BASE_URL}/api/subscriptions`, {
        planId: 'prod_basic',
        paymentMethodId: 'pm_card_visa',
        billingDetails: {
          name: testUser.name,
          email: testUser.email,
          address: {
            line1: '123 Complete St',
            city: 'Complete City',
            state: 'CC',
            postal_code: '12345',
            country: 'US'
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(subscriptionResponse.status).toBe(201);
      expect(subscriptionResponse.data).toHaveProperty('status', 'active');

      // Success! Complete workflow works
      console.log('✅ Complete API workflow test passed!');
    });
  });
});
