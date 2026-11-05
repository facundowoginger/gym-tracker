import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

const LIFT_DOMAIN = [(min) => Math.max(0, Math.floor((min * 0.9) / 5) * 5), (max) => Math.ceil((max * 1.05) / 5) * 5]

// Single-series line chart of one measure over time.
// points: [{ label, value, raw }] where value is in display units and raw is passed to formatValue.
// Optional: goal (a dashed line at that value), pad (tight range of ± pad around the data
// instead of the roomy range used for lifts), tipPrefix (text before the date in the tooltip).
export default function ProgressChart({ points, formatValue, title, goal, pad, tipPrefix = 'Week of ' }) {
  let domain = LIFT_DOMAIN
  if (pad != null) {
    const values = points.map((p) => p.value).concat(goal != null ? [goal] : [])
    domain = [Math.floor(Math.min(...values) - pad), Math.ceil(Math.max(...values) + pad)]
  }
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
            domain={domain}
          />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="var(--muted)"
              strokeDasharray="5 5"
              label={{ value: `Goal ${goal}`, position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: 'var(--muted)', strokeDasharray: '3 3' }}
            content={<ChartTip formatValue={formatValue} tipPrefix={tipPrefix} />}
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

function ChartTip({ active, payload, formatValue, tipPrefix }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="chart-tip">
      <div className="muted small">
        {tipPrefix}
        {p.label}
      </div>
      <strong>{formatValue(p.raw)}</strong>
    </div>
  )
}
