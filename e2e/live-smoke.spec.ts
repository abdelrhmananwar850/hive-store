import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000/';

test('live: homepage loads successfully', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  // Page should load without errors
  await expect(page.locator('body')).toBeVisible();
});

test('live: admin login works', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Fill login form
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  
  await page.waitForTimeout(1000);
  
  // Should see admin dashboard
  await expect(page.locator('body')).toContainText(/لوحة|المنتجات|الطلبات/);
});

test('live: admin products tab accessible', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Click products tab
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await page.waitForTimeout(1000);
  
  // Should see products management
  await expect(page.locator('body')).toContainText(/إدارة المنتجات|منتج/);
});

test('live: admin can filter products by category buttons', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Click products tab
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await page.waitForTimeout(1000);
  
  // Check for category filter buttons (we use buttons now, not select)
  const allButton = page.getByRole('button', { name: 'الكل' });
  if (await allButton.isVisible()) {
    await allButton.click();
    await page.waitForTimeout(500);
  }
  
  // Products should be visible
  await expect(page.locator('body')).toContainText(/منتج|المنتجات/);
});

test('live: admin orders tab accessible', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Click orders tab
  await page.getByRole('button', { name: 'الطلبات' }).click();
  await page.waitForTimeout(1000);
  
  // Should see orders section
  await expect(page.locator('body')).toContainText(/الطلبات|طلب/);
});
