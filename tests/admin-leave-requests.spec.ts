import { expect, test } from "@playwright/test";

test('TC-ADM-LR-001 - Admin can search leave requests by employee', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Leave Requests' }).click();
  
    await page.getByRole('searchbox', { name: 'Search employee' })
      .fill('saad@colanonline.com');
  
    await expect(
      page.getByText('Avaram Mohammed Saad').first()
    ).toBeVisible();
  
  });



  test('TC-ADM-LR-002 - Admin can filter leave requests by MERN department', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Leave Requests' }).click();
  
    const departmentFilter = page.getByLabel('Department');
  
    await departmentFilter.selectOption('MERN');
  
    await expect(departmentFilter).toHaveValue('MERN');
  
  });



  test('TC-ADM-LR-003 - Admin can filter leave requests by Sick Leave', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' })
      .click();
  
    await page.getByRole('link', { name: 'Leave Requests' })
      .click();
  
    const leaveTypeFilter = page.getByLabel('Leave Type');
  
    await leaveTypeFilter.selectOption({
      label: 'Sick Leave'
    });
  
    await expect(
      leaveTypeFilter.locator('option:checked')
    ).toHaveText('Sick Leave');
  
  });



  test('TC-ADM-LR-004 - Admin can filter leave requests by Approved status', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Leave Requests' }).click();
  
    const statusFilter = page.getByLabel('Status');
  
    await statusFilter.selectOption('APPROVED');
  
    await expect(statusFilter).toHaveValue('APPROVED');
  
  });


