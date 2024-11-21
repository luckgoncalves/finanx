'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Transaction {
  data_compra: string;
  nome_cartao: string;
  final_cartao: string;
  categoria: string;
  descricao: string;
  parcela: string;
  valor_usd: number;
  cotacao: number;
  valor_brl: number;
}

const FilteredTransactions = ({ category, transactions }: { 
  category: string;
  transactions: Transaction[];
}) => {
  const filteredItems = transactions.filter(t => t.categoria === category);
  
  return (
    <div className="mt-4 md:mt-8">
      <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-white">Transações - {category}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 border border-gray-700">
          <thead>
            <tr>
              <th className="px-2 md:px-4 py-2 border border-gray-700 text-gray-200 text-sm md:text-base">Data</th>
              <th className="px-2 md:px-4 py-2 border border-gray-700 text-gray-200 text-sm md:text-base">Descrição</th>
              <th className="px-2 md:px-4 py-2 border border-gray-700 text-gray-200 text-sm md:text-base">Parcela</th>
              <th className="px-2 md:px-4 py-2 border border-gray-700 text-gray-200 text-sm md:text-base">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={index} className="text-gray-300 text-sm md:text-base">
                <td className="px-2 md:px-4 py-2 border border-gray-700">{item.data_compra}</td>
                <td className="px-2 md:px-4 py-2 border border-gray-700">{item.descricao}</td>
                <td className="px-2 md:px-4 py-2 border border-gray-700 text-center">{item.parcela}</td>
                <td className={`px-2 md:px-4 py-2 border border-gray-700 text-right ${
                  item.valor_brl < 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(item.valor_brl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const originalCategory = payload[0].payload.categoriaCompleta;
      const categoryTransactions = transactions.filter(t => t.categoria === originalCategory);
      const totalTransactions = categoryTransactions.length;
      
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold text-gray-700">
            {originalCategory || 'Sem categoria'}
          </p>
          <p className="text-lg font-semibold text-red-600">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(value)}
          </p>
          <p className="text-sm text-gray-600">
            Quantidade de transações: {totalTransactions}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const formattedData = jsonData.map((row: any) => ({
      data_compra: row['Data de compra'],
      nome_cartao: row['Nome no cartão'],
      final_cartao: row['Final do Cartão'],
      categoria: row['Categoria'] || 'Sem categoria',
      descricao: row['Descrição'],
      parcela: row['Parcela'],
      valor_usd: typeof row['Valor (em US$)'] === 'string' 
        ? parseFloat(row['Valor (em US$)'].replace('$', '').replace(',', '.') || '0')
        : row['Valor (em US$)'] || 0,
      cotacao: typeof row['Cotação (em R$)'] === 'string'
        ? parseFloat(row['Cotação (em R$)'].replace('R$', '').replace(',', '.') || '0')
        : row['Cotação (em R$)'] || 0,
      valor_brl: typeof row['Valor (em R$)'] === 'string'
        ? parseFloat(row['Valor (em R$)'].replace('R$', '').replace(',', '.') || '0')
        : row['Valor (em R$)'] || 0,
    }));

    setTransactions(formattedData);

    // Process data for chart
    const categoryTotals = formattedData.reduce((acc: any, curr: Transaction) => {
      if (curr.valor_brl < 0) return acc;
      
      if (!acc[curr.categoria]) {
        acc[curr.categoria] = 0;
      }
      acc[curr.categoria] += curr.valor_brl;
      return acc;
    }, {});

    const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
      categoria:  category,
      total: total,
      categoriaCompleta: category
    }));

    setChartData(chartData);
  };

  const handleBarClick = (data: any) => {
    setSelectedCategory(data.categoria);
  };

  // Adicione esta função auxiliar
  const truncateText = (text: string, maxLength: number = 15) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-bold mb-4 md:mb-8 text-white">Finanx - Análise de Gastos</h1>
      
      <div className="w-full max-w-4xl space-y-4 md:space-y-8">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-8 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Selecionar arquivo Excel
          </label>
        </div>

        {transactions.length > 0 && (
          <>
            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  margin={{ 
                    top: 20, 
                    right: isMobile ? 10 : 30,
                    left: isMobile ? 10 : 20,
                    bottom: isMobile ? 60 : 100
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="categoria" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: '#fff', fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(value) => truncateText(value, isMobile ? 10 : 15)}
                  />
                  <YAxis 
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact'
                      }).format(value)
                    }
                    tick={{ fill: '#fff', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
                  />
                  <Bar 
                    dataKey="total" 
                    name="Total de Gastos"
                    isAnimationActive={true}
                    barSize={isMobile ? 20 : 40}
                    onClick={handleBarClick}
                    cursor="pointer"
                  >
                    {
                      chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total < 0 ? '#22c55e' : '#ef4444'}
                        />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedCategory && (
              <div className="overflow-x-auto">
                <FilteredTransactions 
                  category={selectedCategory} 
                  transactions={transactions}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

