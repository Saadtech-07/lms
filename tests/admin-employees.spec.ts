import { test, expect } from '@playwright/test';

test('TC-ADM-EMP-001 - Admin can access Employees page', async ({ page }) => {

  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Email' })
    .fill('affan@colanonline.com');
  await page.getByRole('textbox', { name: 'Password' })
    .fill('Affan@123');
  await page.getByRole('button', { name: 'Login' })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  const employeesLink = page.getByRole('link', {
    name: 'Employees',
    exact: true
  });
  await expect(employeesLink).toBeVisible();
  await employeesLink.click();
  await expect(page).toHaveURL(/\/employees/);
});


test('TC-ADM-EMP-002 - Admin can open Create Employee page', async ({ page }) => {

  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Email' })
    .fill('affan@colanonline.com');

  await page.getByRole('textbox', { name: 'Password' })
    .fill('Affan@123');

  await page.getByRole('button', { name: 'Login' })
    .click();

  await page.getByRole('link', { name: 'Employees' })
    .click();

  await page.getByRole('link', { name: 'Add Employee' })
    .click();

  await expect(page).toHaveURL(/employees\/new/);

  await expect(
    page.getByRole('heading', { name: 'Create Employee' })
  ).toBeVisible();
});


test('TC-ADM-EMP-003 - Admin can create Employee', async ({ page }) => {

  await page.goto('http://localhost:3000/login');

  await page.getByRole('textbox', { name: 'Email' })
    .fill('affan@colanonline.com');

  await page.getByRole('textbox', { name: 'Password' })
    .fill('Affan@123');

  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Employees' }).click();

  await page.getByRole('link', { name: 'Add Employee' }).click();

  await page.locator('input[name="name"]')
    .fill('Testing Employee');

  await page.locator('input[name="email"]')
    .fill('test1@colanonline.com');

  await page.locator('input[name="password"]')
    .fill('Test@123');

  await page.locator('input[name="department"]')
    .fill('Testing');

  await page.locator('input[name="mobile"]')
    .fill('9876789765');

  await page.getByRole('button', { name: 'Create Employee' }).click();

});




test('TC-ADM-EMP-004 - Admin can create Manager', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'Email' }).dblclick();
  await page.getByRole('textbox', { name: 'Email' }).fill('affan@colanonline.com');
  await page.getByRole('textbox', { name: 'Password' }).dblclick();
  await page.getByRole('textbox', { name: 'Password' }).fill('Affan@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Employees' }).click();
  await page.getByRole('link', { name: 'Add Employee' }).click();
  await page.getByText('NameEmailPasswordRoleEMPLOYEEMANAGERADMINDepartmentMobile').click();
  await page.locator('input[name="name"]').dblclick();
  await page.locator('input[name="name"]').fill('Test Manager');
  await page.getByText('Email').click();
  await page.locator('input[name="email"]').dblclick();
  await page.locator('input[name="email"]').fill('testmanager@colanonline.com');
  await page.locator('input[name="password"]').dblclick();
  await page.locator('input[name="password"]').fill('TestManager@123');
  await page.getByRole('combobox').selectOption('MANAGER');
  await page.locator('input[name="department"]').dblclick();
  await page.locator('input[name="department"]').fill('Test Manager');
  await page.locator('input[name="mobile"]').dblclick();
  await page.locator('input[name="mobile"]').fill('9876467445');
  await page.getByRole('button', { name: 'Create Employee' }).click();
  await expect(page).toHaveURL(/\/employees/);
});

test('TC-ADM-EMP-005 - Admin can create Admin', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    await page.getByRole('link', { name: 'Add Employee' }).click();
  
    await page.locator('input[name="name"]')
      .fill('Test Admin');
  
    await page.locator('input[name="email"]')
      .fill('testadmin@colanonline.com');
  
    await page.locator('input[name="password"]')
      .fill('TestAdmin@123');
  
    await page.getByRole('combobox').selectOption('ADMIN');
  
    await page.locator('input[name="department"]')
      .fill('Management');
  
    await page.locator('input[name="mobile"]')
      .fill('9876767555');
  
    await page.getByRole('button', {
      name: 'Create Employee'
    }).click();
  
    await expect(page).toHaveURL(/\/employees/);
  });


  test('TC-ADM-EMP-006 - Admin can search employee', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    await page.getByRole('searchbox', {
      name: 'Search employee or work email'
    }).fill('Testing Employee');
  
    await expect(
      page.getByRole('row').filter({
        hasText: 'Testing Employee'
      })
    ).toBeVisible();
  
  });

  test('TC-ADM-EMP-007 - Admin can filter employees by MERN department', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    await page.getByLabel('Department').selectOption('MERN');
  
    await expect(
      page.getByRole('cell', { name: 'MERN' }).first()
    ).toBeVisible();
  
  });


  test('TC-ADM-EMP-008 - Admin can filter employees by Management department', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    await page.getByLabel('Department').selectOption('Management');
  
    await expect(
      page.getByRole('cell', { name: 'Management' }).first()
    ).toBeVisible();
  
  });



  test('TC-ADM-EMP-009 - Admin can filter active employees', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    const statusFilter = page.getByLabel('Status');
  
    await statusFilter.selectOption('ACTIVE');
  
    await expect(statusFilter).toHaveValue('ACTIVE');
            
    await expect(
      page.getByRole('row').nth(1)
    ).toBeVisible();
  
  });

  test('TC-ADM-EMP-010 - Admin can filter inactive employees', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' }).click();
  
    await page.getByRole('link', { name: 'Employees' }).click();
  
    const statusFilter = page.getByLabel('Status');
  
    await statusFilter.selectOption('INACTIVE');
  
    await expect(statusFilter).toHaveValue('INACTIVE');
  
    await expect(
      page.getByRole('row').nth(1)
    ).toBeVisible();
  
  });



