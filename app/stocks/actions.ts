'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { StocksService } from '@/lib/stocks';
import { DatabaseStock, Market, StockFormData } from '@/types/stock';

const stocksService = new StocksService(supabase);

export async function getStocksByMarket(market: Market): Promise<DatabaseStock[]> {
  try {
    return await stocksService.getStocksByMarket(market);
  } catch (error) {
    console.error('Failed to fetch stocks by market:', error);
    throw error;
  }
}

export async function getAllStocks(): Promise<DatabaseStock[]> {
  try {
    return await stocksService.getAllStocks();
  } catch (error) {
    console.error('Failed to fetch all stocks:', error);
    throw error;
  }
}

export async function createStock(formData: FormData) {
  try {
    const stockData: StockFormData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      englishName: formData.get('englishName') as string,
      market: formData.get('market') as Market,
    };

    // Validate required fields
    if (!stockData.code || !stockData.name || !stockData.englishName || !stockData.market) {
      throw new Error('All fields are required');
    }

    await stocksService.createStock(stockData);
    revalidatePath('/stocks');
    return { success: true };
  } catch (error) {
    console.error('Failed to create stock:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create stock' 
    };
  }
}

export async function updateStock(id: number, formData: FormData) {
  try {
    const stockData: Partial<StockFormData> = {};
    
    const code = formData.get('code') as string;
    const name = formData.get('name') as string;
    const englishName = formData.get('englishName') as string;
    const market = formData.get('market') as Market;

    if (code) stockData.code = code;
    if (name) stockData.name = name;
    if (englishName) stockData.englishName = englishName;
    if (market) stockData.market = market;

    await stocksService.updateStock(id, stockData);
    revalidatePath('/stocks');
    return { success: true };
  } catch (error) {
    console.error('Failed to update stock:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update stock' 
    };
  }
}

export async function deleteStock(id: number) {
  try {
    await stocksService.deleteStock(id);
    revalidatePath('/stocks');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete stock:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete stock' 
    };
  }
} 