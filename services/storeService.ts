import { Product } from '../types';
import { supabase } from '../lib/supabaseClient';

// Helper to map DB columns (snake_case) to App types (camelCase)
const mapProductFromDB = (data: any): Product => ({
  id: data.id,
  name: data.name,
  price: Number(data.price),
  salePrice: data.sale_price ? Number(data.sale_price) : undefined,
  isBestSeller: data.is_best_seller,
  stock: data.stock !== undefined ? Number(data.stock) : 10, // Default to 10 if null
  description: data.description,
  image: data.image,
  category: data.category,
  salesCount: data.sales_count,
  options: data.options || [],
  sku: data.sku || undefined,
  barcode: data.barcode || undefined,
  seoTitle: data.seo_title || undefined,
  seoDescription: data.seo_description || undefined
});

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      // Improved error logging
      console.error('Supabase Data Fetch Error:', error.message || error);
      return [];
    }

    return data.map(mapProductFromDB);
  } catch (err) {
    console.error('Unexpected Error fetching products:', err);
    return [];
  }
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
        console.error('Error fetching product by ID:', error.message);
        return undefined;
    }
    return mapProductFromDB(data);
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export const createProduct = async (product: Omit<Product, 'id' | 'salesCount'>): Promise<Product> => {
  // Map App types to DB columns
  const dbProduct = {
    id: crypto.randomUUID(), // Generate UUID manually if DB doesn't auto-gen
    name: product.name,
    price: product.price,
    sale_price: product.salePrice,
    is_best_seller: product.isBestSeller,
    stock: product.stock,
    description: product.description,
    image: product.image,
    category: product.category,
    options: product.options,
    // sales_count: 0, // Removed to fix column error
    sku: product.sku,
    barcode: product.barcode,
    seo_title: product.seoTitle,
    seo_description: product.seoDescription
  };

  const { data, error } = await supabase
    .from('products')
    .insert([dbProduct])
    .select()
    .single();

  if (error) {
      console.error('Error creating product:', error.message);
      throw error;
  }
  return mapProductFromDB(data);
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  // Map App types to DB columns for update
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
  if (updates.isBestSeller !== undefined) dbUpdates.is_best_seller = updates.isBestSeller;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.options !== undefined) dbUpdates.options = updates.options;
  if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
  if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
  if (updates.seoTitle !== undefined) dbUpdates.seo_title = updates.seoTitle;
  if (updates.seoDescription !== undefined) dbUpdates.seo_description = updates.seoDescription;

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error.message);
    return null;
  }
  return mapProductFromDB(data);
};

export const deleteProductMock = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) console.error('Error deleting product:', error.message);
};

// Tags helpers
export const upsertTags = async (names: string[]): Promise<{id:number,name:string}[]> => {
  const unique = Array.from(new Set(names.map(n => n.trim()).filter(Boolean)));
  if (unique.length === 0) return [];
  const existing = await supabase.from('tags').select('*').in('name', unique);
  const existingNames = new Set((existing.data || []).map((t:any)=>t.name));
  const toInsert = unique.filter(n => !existingNames.has(n)).map(n => ({ name: n }));
  if (toInsert.length) {
    await supabase.from('tags').insert(toInsert);
  }
  const { data } = await supabase.from('tags').select('*').in('name', unique);
  return (data || []).map((t:any)=>({id:t.id,name:t.name}));
};

export const setProductTags = async (productId: string, names: string[]) => {
  const tags = await upsertTags(names);
  await supabase.from('product_tags').delete().eq('product_id', productId);
  if (tags.length) {
    await supabase.from('product_tags').insert(tags.map(t => ({ product_id: productId, tag_id: t.id })));
  }
};

export const fetchProductTags = async (productId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('product_tags')
    .select('tags(name)')
    .eq('product_id', productId);
  return (data || []).map((row:any)=>row.tags?.name).filter(Boolean);
};

// Related products
export const addRelatedProduct = async (productId: string, relatedId: string, type: 'manual'|'auto' = 'manual') => {
  await supabase.from('product_relations').upsert({ product_id: productId, related_id: relatedId, type });
};
export const removeRelatedProduct = async (productId: string, relatedId: string) => {
  await supabase.from('product_relations').delete().eq('product_id', productId).eq('related_id', relatedId);
};
export const fetchRelatedProducts = async (productId: string): Promise<Product[]> => {
  const { data } = await supabase
    .from('product_relations')
    .select('related_id')
    .eq('product_id', productId);
  const ids = (data || []).map((r:any)=>r.related_id);
  if (!ids.length) return [];
  const { data: prods } = await supabase.from('products').select('*').in('id', ids);
  return (prods || []).map(mapProductFromDB);
};
