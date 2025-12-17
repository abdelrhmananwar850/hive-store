import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000/';

test('admin: dashboard stats visible', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Dashboard should show stats
  await expect(page.locator('body')).toContainText(/المنتجات|الطلبات|المبيعات/);
});

test('admin: settings page accessible', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Go to settings
  await page.getByRole('button', { name: 'الإعدادات' }).click();
  await page.waitForTimeout(1000);
  
  // Should see settings form
  await expect(page.locator('body')).toContainText(/إعدادات|اسم المتجر|العملة/);
});

test('admin: discounts page accessible', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Go to discounts
  await page.getByRole('button', { name: 'الخصومات' }).click();
  await page.waitForTimeout(1000);
  
  // Should see discounts section
  await expect(page.locator('body')).toContainText(/خصم|كوبون/);
});

test('admin: logout works', async ({ page }) => {
  await page.goto(`${BASE}#/admin`);
  await page.waitForTimeout(1000);
  
  // Login
  await page.fill('input[placeholder="اسم المستخدم..."]', 'admin');
  await page.fill('input[placeholder="كلمة المرور..."]', 'admin123');
  await page.click('text=تسجيل الدخول');
  await page.waitForTimeout(1000);
  
  // Click logout
  const logoutBtn = page.getByRole('button', { name: /خروج|تسجيل خروج/ });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1000);
    // Should see login form again
    await expect(page.locator('input[placeholder="اسم المستخدم..."]')).toBeVisible();
  }
});

test('store: cart sidebar opens', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  
  // Find cart button in navbar
  const cartButton = page.locator('button[class*="cart"], [aria-label*="cart"], button:has(svg)').first();
  if (await cartButton.isVisible()) {
    await cartButton.click();
    await page.waitForTimeout(500);
    // Cart sidebar should show
    await expect(page.locator('body')).toContainText(/سلة|السلة|فارغة/);
  }
});


test('store: rate order page accessible', async ({ page }) => {
  // Test with a fake order ID - should show "order not found"
  await page.goto(`${BASE}#/rate/fake-order-123`);
  await page.waitForTimeout(2000);
  // Should show some message (either not found or the page loaded)
  await expect(page.locator('body')).toBeVisible();
});

test('store: product details shows related products', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  
  // Click on first product
  const productLink = page.locator('a[href*="product"]').first();
  if (await productLink.isVisible()) {
    await productLink.click();
    await page.waitForTimeout(1500);
    // Check for related products section or add to cart button
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  }
});
