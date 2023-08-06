import { test } from '~integration_tests/fixtures';
import { API_URL, getProjectsGetUrl, getBuildsGetUrl } from '~integration_tests/utils/data';
import {
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
  TEST_PROJECT,
  TEST_RUN_APPROVED,
  TEST_RUN_NEW,
  TEST_RUN_OK,
  TEST_UNRESOLVED,
} from '~client/_test/test.data.helper';

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await page.route(getProjectsGetUrl(API_URL), route => route.fulfill({
    body: JSON.stringify([project]),
  }));
  await page.route(getBuildsGetUrl(project.id), route => route.fulfill({
    body: JSON.stringify({
      data: [
        TEST_BUILD_FAILED,
        TEST_BUILD_PASSED,
        TEST_BUILD_UNRESOLVED,
      ],
      skip: 0,
      take: 10,
      total: 3,
    }),
  }));
  await page.route(`**/builds/${TEST_BUILD_FAILED.id}`, route => route.fulfill({
    body: JSON.stringify(TEST_BUILD_FAILED),
  }));
  await page.route(`**/test-runs?buildId=${TEST_BUILD_FAILED.id}`, route => route.fulfill({
    body: JSON.stringify([
      TEST_UNRESOLVED,
      TEST_RUN_APPROVED,
      TEST_RUN_NEW,
      TEST_RUN_OK,
    ]),
  }));
  await page.route(`**/test-runs/${TEST_UNRESOLVED.id}`, route => route.fulfill({
    body: JSON.stringify(TEST_UNRESOLVED),
  }));
  await page.route(`**/baseline.png`, route => route.fulfill({
    path: 'integration_tests/images/baseline.png',
  }));
  await page.route(`**/diff.png`, route => route.fulfill({
    path: 'integration_tests/images/diff.png',
  }));
  await page.route(`**/image.png`, route => route.fulfill({
    path: 'integration_tests/images/image.png',
  }));
})

test('renders', async ({ openProjectPage, page, vrt }) => {
  const projectPage = await openProjectPage(project.id);
  await projectPage.getBuildLocator(TEST_BUILD_FAILED.number).click();

  await vrt.trackPage(page, 'Project page. Test run list');

  await projectPage.getTestRunLocator(TEST_UNRESOLVED.name).click();

  await vrt.trackPage(page, 'Project page. Test run details');
});
