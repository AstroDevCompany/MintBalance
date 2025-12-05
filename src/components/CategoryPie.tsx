import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { formatCurrency } from '../lib/finance'

type Slice = { name: string; value: number }

const colors = ['#2dd4bf', '#22d3ee', '#34d399', '#5eead4', '#38bdf8', '#67e8f9']

type Props = {
  data: Slice[]
  currency: string
}

export const CategoryPie = ({ data, currency }: Props) => (
  <div className="h-64 w-full">
    <ResponsiveContainer>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={4}
          label={(entry) => entry.name}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#0b1625',
            borderRadius: 12,
            border: '1px solid #1f2b3a',
            color: '#e2e8f0',
          }}
          formatter={(value: number, _name: string, entry) =>
            `${entry.payload.name}: ${formatCurrency(value, currency)}`
          }
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
)
