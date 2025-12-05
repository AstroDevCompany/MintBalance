import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../lib/finance'

type Point = {
  month: string
  income: number
  expense: number
  net: number
}

type Props = {
  data: Point[]
  showIncome: boolean
  showExpense: boolean
  currency: string
}

export const CashflowChart = ({
  data,
  showIncome,
  showExpense,
  currency,
}: Props) => (
  <div className="h-72 w-full">
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ left: -10, right: 10 }}>
        <defs>
          <linearGradient id="income" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="expense" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="net" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2b3a" />
        <XAxis dataKey="month" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          cursor={{ stroke: '#1f2b3a' }}
          contentStyle={{
            backgroundColor: '#0b1625',
            borderRadius: 12,
            border: '1px solid #1f2b3a',
            color: '#e2e8f0',
          }}
          formatter={(value: number) => formatCurrency(value, currency)}
        />
        <Legend />
        {showIncome && (
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#34d399"
            fillOpacity={1}
            fill="url(#income)"
          />
        )}
        {showExpense && (
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#22d3ee"
            fillOpacity={1}
            fill="url(#expense)"
          />
        )}
        <Area
          type="monotone"
          dataKey="net"
          name="Net"
          stroke="#a5b4fc"
          fillOpacity={0.6}
          fill="url(#net)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)
