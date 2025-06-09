import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockTable } from '@/components/stock-table';
import { getAllStocks } from './actions';
import { DatabaseStock } from '@/types/stock';
import { MainNav } from '@/components/main-nav';

export default async function StocksPage() {
  try {
    const allStocks = await getAllStocks();
    
    // Group stocks by market
    const taiwanStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'TW');
    const chinaStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'CN');
    const usStocks = allStocks.filter((stock: DatabaseStock) => stock.market === 'US');

    return (
      <div className="min-h-screen bg-background">
        {/* Header with Navigation */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <MainNav />
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">股票信息</h1>
            <p className="text-muted-foreground">
              管理台湾、中国大陆和美国的股票信息
            </p>
          </div>

          <Tabs defaultValue="tw" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tw" className="flex items-center gap-2">
                🇹🇼 台湾股市
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                  {taiwanStocks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cn" className="flex items-center gap-2">
                🇨🇳 中国股市
                <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                  {chinaStocks.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="us" className="flex items-center gap-2">
                🇺🇸 美国股市
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                  {usStocks.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tw" className="mt-6">
              <StockTable 
                stocks={taiwanStocks}
                market="TW"
                title="台湾股票市场"
              />
            </TabsContent>

            <TabsContent value="cn" className="mt-6">
              <StockTable 
                stocks={chinaStocks}
                market="CN"
                title="中国股票市场"
              />
            </TabsContent>

            <TabsContent value="us" className="mt-6">
              <StockTable 
                stocks={usStocks}
                market="US"
                title="美国股票市场"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with Navigation */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <MainNav />
          </div>
        </header>

        {/* Error Content */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">股票信息</h1>
          <div className="text-red-600 dark:text-red-400">
            加载股票数据失败: {error instanceof Error ? error.message : '未知错误'}
          </div>
        </div>
      </div>
    );
  }
} 