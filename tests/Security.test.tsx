import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetails from '../pages/ProductDetails';
import { StoreProvider } from '../context/StoreContext';

vi.mock('../services/storeService', () => {
  return {
    fetchProducts: async () => [],
    fetchProductById: async () => ({
      id: 'x',
      name: '<img src=x onerror=alert(1)>',
      price: 1,
      description: '<svg onload=alert(1)>',
      image: 'https://via.placeholder.com/400',
      category: 'cat',
      salesCount: 0,
      stock: 1
    })
  };
});

vi.mock('../lib/supabaseClient', () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({ single: () => ({ data: { store_name: 'Hive', logo_text: 'H', primary_color: '#0d9488', secondary_color: '#111827' } }) }),
        order: () => ({ data: [] })
      })
    }
  };
});

describe('Security', () => {
  it('does not execute inline event handlers from product fields', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <StoreProvider>
        <MemoryRouter initialEntries={['/product/x']}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </StoreProvider>
    );
    expect(await screen.findByText('cat')).toBeInTheDocument();
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
