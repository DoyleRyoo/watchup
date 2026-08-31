import { apiRequest } from '../../api/client'
import type {
  CoinChartResponse,
  SearchCoinsResponse,
} from './types'

export function searchCoins(query: string, signal?: AbortSignal): Promise<SearchCoinsResponse> {
  const searchParams = new URLSearchParams({ query })
  return apiRequest(`/coins/search?${searchParams.toString()}`, { signal })
}

export function getCoinChart(
  marketCode: string,
  signal?: AbortSignal,
): Promise<CoinChartResponse> {
  return apiRequest(`/coins/${encodeURIComponent(marketCode)}/chart`, { signal })
}
