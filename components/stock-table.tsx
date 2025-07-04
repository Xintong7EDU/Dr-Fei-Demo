'use client';

import { useState } from 'react';
import { StockWithRealTimeData, Market } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, XIcon, ExternalLinkIcon } from 'lucide-react';
import { createStock, updateStock, deleteStock } from '@/app/stocks/actions';
import { useToastContext } from '@/hooks/use-toast-context';

interface StockTableProps {
  stocks: StockWithRealTimeData[];
  market: Market;
  title: string;
}

interface EditingStock {
  id: number;
  code: string;
  name: string;
  englishName: string;
}

const marketLabels = {
  TW: '台湾',
  CN: '中国',
  US: '美国'
};

export function StockTable({ stocks, market, title }: StockTableProps) {
  const [editingStock, setEditingStock] = useState<EditingStock | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState({
    code: '',
    name: '',
    englishName: ''
  });
  const { toast } = useToastContext();

  const handleEdit = (stock: StockWithRealTimeData) => {
    setEditingStock({
      id: stock.id,
      code: stock.code,
      name: stock.name,
      englishName: stock.english_name
    });
  };

  const handleSave = async () => {
    if (!editingStock) return;

    const formData = new FormData();
    formData.append('code', editingStock.code);
    formData.append('name', editingStock.name);
    formData.append('englishName', editingStock.englishName);
    formData.append('market', market);

    const result = await updateStock(editingStock.id, formData);
    
    if (result.success) {
      toast({
        title: '更新成功',
        description: '股票信息已更新',
      });
      setEditingStock(null);
    } else {
      toast({
        title: '更新失败',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这只股票吗？')) return;

    const result = await deleteStock(id);
    
    if (result.success) {
      toast({
        title: '删除成功',
        description: '股票已删除',
      });
    } else {
      toast({
        title: '删除失败',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleAdd = async () => {
    if (!newStock.code || !newStock.name || !newStock.englishName) {
      toast({
        title: '请填写完整信息',
        description: '所有字段都是必填的',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('code', newStock.code);
    formData.append('name', newStock.name);
    formData.append('englishName', newStock.englishName);
    formData.append('market', market);

    const result = await createStock(formData);
    
    if (result.success) {
      toast({
        title: '添加成功',
        description: '新股票已添加',
      });
      setNewStock({ code: '', name: '', englishName: '' });
      setShowAddForm(false);
    } else {
      toast({
        title: '添加失败',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleYahooFinanceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary">{stocks.length} 只股票</Badge>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="outline"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          添加股票
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add Form */}
        {showAddForm && (
          <div className="mb-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-3">添加新股票到{marketLabels[market]}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="股票代码"
                value={newStock.code}
                onChange={(e) => setNewStock({ ...newStock, code: e.target.value })}
              />
              <Input
                placeholder="公司中文简称"
                value={newStock.name}
                onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
              />
              <Input
                placeholder="英文名称"
                value={newStock.englishName}
                onChange={(e) => setNewStock({ ...newStock, englishName: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  保存
                </Button>
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline" 
                  size="sm"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  股票代码
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  公司中文简称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  英文名称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  现价
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  日内最高
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  日内最低
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  52周最高
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  52周最低
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {stocks.map((stock) => (
                <tr key={stock.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {editingStock?.id === stock.id ? (
                      <Input
                        value={editingStock.code}
                        onChange={(e) =>
                          editingStock && setEditingStock({ ...editingStock, code: e.target.value })
                        }
                        className="w-24"
                      />
                    ) : (
                      stock.code
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {editingStock?.id === stock.id ? (
                      <Input
                        value={editingStock.name}
                        onChange={(e) =>
                          editingStock && setEditingStock({ ...editingStock, name: e.target.value })
                        }
                        className="w-48"
                      />
                    ) : (
                      stock.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {editingStock?.id === stock.id ? (
                      <Input
                        value={editingStock.englishName}
                        onChange={(e) =>
                          editingStock && setEditingStock({ ...editingStock, englishName: e.target.value })
                        }
                        className="w-48"
                      />
                    ) : (
                      stock.english_name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {stock.currentPrice?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {stock.dayHigh?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {stock.dayLow?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {stock.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {stock.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {editingStock?.id === stock.id ? (
                        <>
                          <Button onClick={handleSave} size="sm">
                            <SaveIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setEditingStock(null)}
                            variant="outline"
                            size="sm"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(stock)} variant="outline" size="sm">
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(stock.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => handleYahooFinanceClick(stock.yahooFinanceUrl)} 
                            variant="outline"
                            size="sm"
                          >
                             <ExternalLinkIcon className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            暂无{marketLabels[market]}股票数据
          </div>
        )}
      </CardContent>
    </Card>
  );
} 