import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatChartDate, formatPrice } from './formatters'
import type { CoinChart } from './types'

// Recharts renders SVG/inline-styled nodes, so the design tokens are handed to
// it as props instead of CSS rules. Values only — no mockup layout styles.
const AXIS_TICK = { fill: 'var(--text-sub)', fontSize: 10 }
const TOOLTIP_CONTENT = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text-main)',
  fontSize: 12,
}
const TOOLTIP_LABEL = { color: 'var(--text-sub)', fontSize: 10 }

export function PriceChart({ chart }: { chart: CoinChart }) {
  const count = chart.candles.length
  if (count === 0) {
    return <p className="chart-empty">차트를 이용할 수 없습니다.</p>
  }

  const chartData = chart.candles.map((candle) => ({
    ...candle,
    closingPriceValue: Number(candle.closingPrice),
  }))
  const chartMode = count === 1 ? 'point' : 'line'

  return (
    <div className="chart-block">
      <div
        className="price-chart-canvas"
        role="img"
        aria-label={`${chart.marketCode} 최근 30일 종가 차트, 데이터 ${count}개`}
        data-chart-mode={chartMode}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 720, height: 327 }}>
          <LineChart data={chartData} accessibilityLayer margin={{ top: 12, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              minTickGap={24}
              tick={AXIS_TICK}
              stroke="var(--border)"
            />
            <YAxis
              dataKey="closingPriceValue"
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => formatPrice(value)?.replace(/원$/, '') ?? ''}
              width={88}
              tick={AXIS_TICK}
              stroke="var(--border)"
            />
            <Tooltip
              labelFormatter={(label) => String(label)}
              formatter={(value) => [formatPrice(Number(value)) ?? '', '종가']}
              contentStyle={TOOLTIP_CONTENT}
              labelStyle={TOOLTIP_LABEL}
              cursor={{ stroke: 'var(--text-sub)', strokeWidth: 1 }}
            />
            <Line
              type="linear"
              dataKey="closingPriceValue"
              name="종가"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={count === 1 ? { r: 5, strokeWidth: 2 } : false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {count < 30 && <p className="chart-note">상장 이후 제공 가능한 가격 데이터만 표시합니다.</p>}
    </div>
  )
}
