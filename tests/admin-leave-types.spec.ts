import { expect, test } from "@playwright/test";

test('TC-ADM-LT-001 - Admin can create Leave Type', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' })
      .click();
  
    await page.getByRole('link', { name: 'Leave Types' })
      .click();
  
    await page.getByRole('button', { name: 'Add Leave Type' })
      .click();
  
    await page.getByRole('textbox', { name: 'Name' })
      .fill('Testing Leave');
  
    await page.getByRole('spinbutton', { name: 'Total Days' })
      .fill('12');
  
    await page.getByRole('button', { name: 'Create' })
      .click();
  
    const leaveRow = page
      .getByRole('row')
      .filter({ hasText: 'Testing Leave' });
        
    await expect(leaveRow).toBeVisible();
  
    await expect(
      leaveRow.getByText('12', { exact: true })
    ).toBeVisible();
  });




  test('TC-ADM-LT-002 - Admin can edit Leave Type', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' })
      .click();
  
    await page.getByRole('link', { name: 'Leave Types' })
      .click();
  
    const leaveRow = page
      .getByRole('row')
      .filter({ hasText: 'Testing Leave' });
  
    await expect(leaveRow).toBeVisible();
  
    await leaveRow
      .getByText('Edit', { exact: true })
      .click();
  
    await page.getByRole('textbox', { name: 'Name' })
      .fill('Updated Testing Leave');
  
    await page.getByRole('spinbutton', { name: 'Total Days' })
      .fill('15');
  
    await page.getByRole('button', { name: 'Update' }).click();
  
    const updatedRow = page
      .getByRole('row')
      .filter({ hasText: 'Updated Testing Leave' });
  
    await expect(updatedRow).toBeVisible();
  
    await expect(
      updatedRow.getByText('15', { exact: true })
    ).toBeVisible();
  });




  test('TC-ADM-LT-003 - Admin can deactivate Leave Type', async ({ page }) => {

    await page.goto('http://localhost:3000/login');
  
    await page.getByRole('textbox', { name: 'Email' })
      .fill('affan@colanonline.com');
  
    await page.getByRole('textbox', { name: 'Password' })
      .fill('Affan@123');
  
    await page.getByRole('button', { name: 'Login' })
      .click();
  
    await page.getByRole('link', { name: 'Leave Types' })
      .click();
  
    const leaveRow = page
      .getByRole('row')
      .filter({ hasText: 'Updated Testing Leave' });
  
    await leaveRow.getByRole('button', { name: 'ACTIVE' })
      .click();
  
    await expect(
      leaveRow.getByText('INACTIVE')
    ).toBeVisible();
  });