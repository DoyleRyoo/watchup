import type { ApiListMeta, ApiSuccess } from '../../api/types'

export type SearchResult = {
  marketCode: string
  koreanName: string
  englishName: string
  status: 'ACTIVE' | 'CAUTION'
}

export type MarketPriceStatus = 'ACTIVE' | 'CAUTION' | 'UNAVAILABLE' | 'PRICE_ERROR'

export type MarketPriceItem = {
  marketCode: string
  koreanName: string
  englishName: string
  symbol: string
  currentPrice: number | null
  signedChangeRate: number | null
  status: MarketPriceStatus
  isStale: boolean
}

export type ChartCandle = {
  date: string
  closingPrice: number
}

export type CoinChart = {
  marketCode: string
  period: '30d'
  candles: ChartCandle[]
}

export type SearchCoinsResponse = ApiSuccess<SearchResult[], ApiListMeta>
export type CoinChartResponse = ApiSuccess<CoinChart, ApiListMeta>
