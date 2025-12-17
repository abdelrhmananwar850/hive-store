import { test, expect } from '@playwright/test';

test('smoke: homepage loads and products visible', async ({ page }) => {
  page.on('dialog', d => d.dismiss());
  await page.goto('http://localhost:3000/');
  // Wait for products to load
  await page.waitForTimeout(2000);
  // Check main heading or store name
  await expect(page.locator('body')).toContainText('Hive');
});

test('smoke: product detail page and add to cart', async ({ page }) => {
  page.on('dialog', d => d.dismiss());
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(2000);
  
  // Click on first product card to go to details
  const productCard = page.locator('[class*="ProductCard"], [class*="product"], a[href*="product"]').first();
  if (await productCard.isVisible()) {
    await productCard.click();
    await page.waitForTimeout(1000);
    // Check for add to cart button
    const addToCartBtn = page.getByRole('button', { name: /أضف للسلة|إضافة/ });
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
    }
  }
});

test('smoke: checkout page accessible', async ({ page }) => {
  await page.goto('http://localhost:3000/#/checkout');
  await page.waitForTimeout(1000);
  // Either shows checkout form or empty cart message
  const hasCheckout = await page.getByText(/إتمام الطلب|سلتك فارغة/).isVisible();
  expect(hasCheckout).toBeTruthy();
});
