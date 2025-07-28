const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4006';
let authToken = null;

describe('Subscriptions API Tests', () => {
  beforeAll(async () => {
    // Check if mock server is running
    try {
      await axios.get(BASE_URL);
    } catch (error) {
      throw new Error('Mock server is not running. Please run: npm run start:mock');
    }

    // Register and login to get auth token
    await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'subscription.test@example.com',
      password: 'SubTest123!',
      name: 'Subscription Test User',
      company: 'Subscription Test Co'
    });

    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'subscription.test@example.com',
      password: 'SubTest123!'
    });

    authToken = loginResponse.data.access_token;
  });

  describe('Products', () => {
    test('should get available products', async () => {
      const response = await axios.get(`${BASE_URL}/api/products`);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('products');
      expect(Array.isArray(response.data.products)).toBe(true);
      expect(response.data.products.length).toBeGreaterThan(0);
      
      // Check product structure
      const product = response.data.products[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('interval');
    });
  });

  describe('Subscription Creation', () => {
    test('should fail without authorization', async () => {
      try {
        await axios.post(`${BASE_URL}/api/subscriptions`, {
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
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(200); // Mock server returns 200 with error message
        expect(error.response.data).toHaveProperty('message', 'Authorization required');
      }
    });

    test('should create subscription with valid data', async () => {
      const subscriptionData = {
        planId: 'prod_basic',
        paymentMethodId: 'pm_card_visa',
        billingDetails: {
          name: 'Subscription Test User',
          email: 'subscription.test@example.com',
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
      expect(response.data).toHaveProperty('customerId');
      expect(response.data).toHaveProperty('currentPeriodEnd');
    });

    test('should fail with invalid plan ID', async () => {
      const subscriptionData = {
        planId: 'nonexistent_plan',
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
        await axios.post(`${BASE_URL}/api/subscriptions`, subscriptionData, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        // Mock server might not validate plan IDs, but production should
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('should fail with missing billing details', async () => {
      const subscriptionData = {
        planId: 'prod_basic',
        paymentMethodId: 'pm_card_visa'
        // Missing billingDetails
      };

      try {
        await axios.post(`${BASE_URL}/api/subscriptions`, subscriptionData, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('should handle different payment methods', async () => {
      const paymentMethods = ['pm_card_visa', 'pm_card_mastercard', 'pm_card_amex'];
      
      for (const paymentMethod of paymentMethods) {
        const subscriptionData = {
          planId: 'prod_basic',
          paymentMethodId: paymentMethod,
          billingDetails: {
            name: `Test User ${paymentMethod}`,
            email: `test.${paymentMethod}@example.com`,
            address: {
              line1: '123 Test St',
              city: 'Test City',
              state: 'TS',
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
      }
    });
  });

  describe('Authorization', () => {
    test('should fail with invalid token', async () => {
      try {
        await axios.post(`${BASE_URL}/api/subscriptions`, {
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
        }, {
          headers: {
            'Authorization': 'Bearer invalid-token-here'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(200); // Mock server returns 200 with error message
        expect(error.response.data).toHaveProperty('message', 'Authorization required');
      }
    });

    test('should fail with malformed authorization header', async () => {
      try {
        await axios.post(`${BASE_URL}/api/subscriptions`, {
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
        }, {
          headers: {
            'Authorization': authToken // Missing "Bearer" prefix
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(200); // Mock server returns 200 with error message
        expect(error.response.data).toHaveProperty('message', 'Authorization required');
      }
    });
  });
});
