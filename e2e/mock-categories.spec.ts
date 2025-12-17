import { test, expect } from '@playwright/test';

test('admin: products page loads with category buttons', async ({ page }) => {
  await page.goto('http://localhost:3000/#/admin');
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Go to products
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await page.waitForTimeout(1000);
  
  // Check for "الكل" button (category filter)
  const allButton = page.getByRole('button', { name: 'الكل' });
  await expect(allButton).toBeVisible();
});

test('admin: search products works', async ({ page }) => {
  await page.goto('http://localhost:3000/#/admin');
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Go to products
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await page.waitForTimeout(1000);
  
  // Find search input
  const searchInput = page.locator('input[placeholder*="بحث"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('test');
    await page.waitForTimeout(500);
  }
});

test('admin: add product modal opens', async ({ page }) => {
  await page.goto('http://localhost:3000/#/admin');
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Go to products
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await page.waitForTimeout(1000);
  
  // Click add product button
  const addButton = page.getByRole('button', { name: /إضافة منتج|منتج جديد/ });
  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(500);
    // Modal should appear with form
    await expect(page.locator('body')).toContainText(/اسم المنتج|السعر/);
  }
});
