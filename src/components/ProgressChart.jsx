import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Single-series line chart of one measure over time.
// points: [{ label, value, raw }] where value is in display units and raw is passed to formatValue.
export default function ProgressChart({ points, formatValue, title }) {
  return (
    <div className="chart" role="img" aria-label={title}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            width={44}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickCount={5}
            domain={[(min) => Math.max(0, Math.floor((min * 0.9) / 5) * 5), (max) => Math.ceil((max * 1.05) / 5) * 5]}
          />
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
            content={<ChartTip formatValue={formatValue} />}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="var(--chart)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--chart)', stroke: 'var(--surface)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: 'var(--chart)', stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChartTip({ active, payload, formatValue }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="chart-tip">
      <div className="muted small">Week of {p.label}</div>
      <strong>{formatValue(p.raw)}</strong>
    </div>
  )
}
