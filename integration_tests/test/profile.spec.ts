import { test } from '~integration_tests/fixtures';
import { API_URL, getProjectsGetUrl } from '~integration_tests/utils/data';
import { TEST_PROJECT } from '~client/_test/test.data.helper';

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await page.route(getProjectsGetUrl(API_URL), route => route.fulfill({
    body: JSON.stringify([project]),
  }));
})

test('renders', async ({ profilePage, page, vrt }) => {
  await vrt.trackPage(page, 'Profile page');
});
