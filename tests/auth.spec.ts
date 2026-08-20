import { test, expect } from '@playwright/test';

test('TC-ADM-AUTH-001 - Admin can login with valid credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Email' })
    .fill('affan@colanonline.com');

  await page.getByRole('textbox', { name: 'Password' })
    .fill('Affan@123');

  await page.getByRole('button', { name: 'Login' })
    .click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText('ADMIN')).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Employees' })
  ).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Leave Requests' })
  ).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Leave Types' })
  ).toBeVisible();
});




test('TC-ADM-AUTH-002 - Admin cannot login with invalid password', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('WrongPassword@123');
  
    await page.getByRole('button', { name: 'Login' })
      .click();
  
    await expect(
      page.getByText('Invalid email or password')
    ).toBeVisible();
  
    await expect(page).toHaveURL(/login/);
  
  });