# API Tests

Tests for the main API workflows - authentication, products, and subscriptions.

## Running the tests

First time setup:
```bash
cd source/subscription-api-testing
npm install
```

To run tests:
```bash
# Start the mock server first (from project root)
npm run start:mock

# Then run the tests
cd source/subscription-api-testing
npm test
```

### Other test commands
```bash
# Watch mode (re-runs tests when files change)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

## Test Files

- `authentication.test.js` - Tests user registration and login
- `subscriptions.test.js` - Tests products and subscription creation

## What Gets Tested

**Authentication:**
- User registration with valid data
- Error handling for missing fields
- Login with correct/incorrect credentials
- Duplicate email handling
- Invalid email format handling

**Subscriptions:**
- Getting available products
- Creating subscriptions with valid auth
- Authorization protection
- Different payment methods
- Error handling for invalid data

## Notes

- Tests run against the mock server (http://localhost:4006)
- Mock server has simplified validation compared to production
- All tests should pass if the mock server is running correctly
