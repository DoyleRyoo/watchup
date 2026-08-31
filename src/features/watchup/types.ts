import type { ApiListMeta, ApiSuccess } from '../../api/types'

export type MarketStatus = 'ACTIVE' | 'CAUTION' | 'UNAVAILABLE'
export type PriceStatus = 'FRESH' | 'STALE' | 'PRICE_ERROR'

export type SearchResult = {
  marketCode: string
  koreanName: string
  englishName: string
  status: MarketStatus
}

export type MarketPriceStatus = MarketStatus | 'PRICE_ERROR'

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
  closingPrice: string
}

export type CoinChart = {
  marketCode: string
  koreanName: string
  englishName: string
  marketStatus: MarketStatus
  currentPrice: string | null
  priceStatus: PriceStatus
  period: '30d'
  candles: ChartCandle[]
}

export type SearchCoinsResponse = ApiSuccess<SearchResult[], ApiListMeta>
export type CoinChartResponse = ApiSuccess<CoinChart, ApiListMeta>
