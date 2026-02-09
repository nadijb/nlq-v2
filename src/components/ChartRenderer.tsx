'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartData } from '@/types/chat'

interface ChartRendererProps {
  chartType: string
  data: ChartData
}

const COLORS = [
  '#13285a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#0891b2',
  '#4f46e5',
  '#c026d3',
  '#059669',
]

export default function ChartRenderer({ chartType, data }: ChartRendererProps) {
  const chartData = data.values.map((item) => {
    const processed: Record<string, string | number> = {}
    Object.keys(item).forEach((key) => {
      const value = item[key]
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      processed[key] = isNaN(numValue) ? value : numValue
    })
    return processed
  })

  const renderChart = () => {
    switch (chartType) {
      case 'PieChart':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius="70%"
              fill="#8884d8"
              dataKey={data.valueKey}
              nameKey={data.nameKey}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, data.valueKey]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
          </PieChart>
        )

      case 'BarChart':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={data.xAxisKey || data.nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            {data.bars ? (
              data.bars.map((bar, index) => (
                <Bar
                  key={bar.dataKey}
                  dataKey={bar.dataKey}
                  fill={bar.fill || COLORS[index % COLORS.length]}
                  name={bar.name || bar.dataKey}
                  radius={[4, 4, 0, 0]}
                />
              ))
            ) : (
              <Bar
                dataKey={data.yAxisKey || data.valueKey}
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        )

      case 'LineChart':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={data.xAxisKey || data.nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            {data.lines ? (
              data.lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke || COLORS[index % COLORS.length]}
                  name={line.name || line.dataKey}
                  strokeWidth={2}
                  dot={{ fill: line.stroke || COLORS[index % COLORS.length], strokeWidth: 2 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={data.yAxisKey || data.valueKey}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], strokeWidth: 2 }}
              />
            )}
          </LineChart>
        )

      case 'AreaChart':
        return (
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={data.xAxisKey || data.nameKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={data.yAxisKey || data.valueKey}
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        )

      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Unsupported chart type: {chartType}
          </div>
        )
    }
  }

  return (
    <div className="w-full bg-white rounded-lg p-2 md:p-4">
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
