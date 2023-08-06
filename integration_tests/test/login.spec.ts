import { test } from '~integration_tests/fixtures';
import { expect } from '@playwright/test';

test('renders', async ({ page, vrt }) => {
  await vrt.trackPage(page, 'Login page');
});


test('can login', async ({ loginPage }) => {
  await loginPage.email.type('email@google.com');
  await loginPage.password.type('123456');

  const [request] = await Promise.all([
    loginPage.page.waitForRequest('**/login'),
    loginPage.loginBtn.click()
  ]);

  expect(request.postDataJSON()).toEqual({
    email: 'email@google.com',
    password: '123456'
  });
});
