import { create } from 'zustand'
import { ApiError, createContractError } from '../api/errors'
import type { ApiListMeta } from '../api/types'
import { getCoinChart, searchCoins } from '../features/watchup/api'
import type { CoinChart, MarketPriceItem, SearchResult } from '../features/watchup/types'

type WatchupDataState = {
  searchQuery: string
  searchResults: SearchResult[]
  searchLoading: boolean
  searchError: ApiError | null
  hasSearched: boolean
  selectedCoin: MarketPriceItem | null
  chartData: CoinChart | null
  chartMeta: ApiListMeta | null
  chartLoading: boolean
  chartError: ApiError | null
}

type WatchupActions = {
  setSearchQuery: (query: string) => void
  submitSearch: () => Promise<void>
  cancelSearchRequest: () => void
  loadSelectedChart: () => Promise<void>
  cancelPendingRequests: () => void
  reset: () => void
}

type WatchupState = WatchupDataState & WatchupActions

const initialState: WatchupDataState = {
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchError: null,
  hasSearched: false,
  selectedCoin: null,
  chartData: null,
  chartMeta: null,
  chartLoading: false,
  chartError: null,
}

let searchRequestId = 0
let searchController: AbortController | null = null
let submittedSearchQuery: string | null = null
let searchPromise: Promise<void> | null = null
let chartRequestId = 0
let chartController: AbortController | null = null
let chartMarketCode: string | null = null
let chartPromise: Promise<void> | null = null

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : createContractError()
}

function invalidateSearchRequest(): void {
  searchRequestId += 1
  searchController?.abort()
  searchController = null
  submittedSearchQuery = null
  searchPromise = null
}

function invalidateChartRequest(): void {
  chartRequestId += 1
  chartController?.abort()
  chartController = null
  chartMarketCode = null
  chartPromise = null
}

function clearRuntimeRequests(): void {
  invalidateSearchRequest()
  invalidateChartRequest()
}

export const useWatchupStore = create<WatchupState>((set, get) => ({
  ...initialState,
  setSearchQuery: (searchQuery) => {
    const normalizedQuery = searchQuery.trim()
    if (searchController && submittedSearchQuery !== normalizedQuery) {
      invalidateSearchRequest()
      set({
        searchQuery,
        searchResults: [],
        searchLoading: false,
        searchError: null,
        hasSearched: false,
      })
      return
    }
    set({ searchQuery })
  },
  submitSearch: () => {
    const normalizedQuery = get().searchQuery.trim()
    if (!normalizedQuery) return Promise.resolve()
    if (searchController && submittedSearchQuery === normalizedQuery && searchPromise) {
      return searchPromise
    }

    invalidateSearchRequest()
    const requestId = searchRequestId
    const controller = new AbortController()
    searchController = controller
    submittedSearchQuery = normalizedQuery
    set({
      searchResults: [],
      searchLoading: true,
      searchError: null,
      hasSearched: false,
    })

    const request = searchCoins(normalizedQuery, controller.signal)
      .then((response) => {
        if (requestId !== searchRequestId || controller.signal.aborted) return
        set({
          searchResults: response.data,
          searchLoading: false,
          searchError: null,
          hasSearched: true,
        })
      })
      .catch((error: unknown) => {
        if (requestId !== searchRequestId || isAbortError(error)) return
        set({
          searchResults: [],
          searchLoading: false,
          searchError: asApiError(error),
          hasSearched: true,
        })
      })
      .finally(() => {
        if (requestId !== searchRequestId) return
        searchController = null
        submittedSearchQuery = null
        searchPromise = null
      })

    searchPromise = request
    return request
  },
  cancelSearchRequest: () => {
    invalidateSearchRequest()
    set({ searchLoading: false })
  },
  loadSelectedChart: () => {
    const selectedCoin = get().selectedCoin
    if (!selectedCoin || (selectedCoin.status !== 'ACTIVE' && selectedCoin.status !== 'CAUTION')) {
      invalidateChartRequest()
      set({ chartData: null, chartMeta: null, chartLoading: false, chartError: null })
      return Promise.resolve()
    }
    if (chartMarketCode === selectedCoin.marketCode && chartPromise) return chartPromise
    if (get().chartData?.marketCode === selectedCoin.marketCode && !get().chartError) {
      return Promise.resolve()
    }

    invalidateChartRequest()
    const requestId = chartRequestId
    const controller = new AbortController()
    chartController = controller
    chartMarketCode = selectedCoin.marketCode
    set({ chartData: null, chartMeta: null, chartLoading: true, chartError: null })

    const request = getCoinChart(selectedCoin.marketCode, controller.signal)
      .then((response) => {
        if (
          requestId !== chartRequestId
          || controller.signal.aborted
          || get().selectedCoin?.marketCode !== selectedCoin.marketCode
        ) return
        if (response.data.marketCode !== selectedCoin.marketCode) {
          set({ chartData: null, chartMeta: null, chartLoading: false, chartError: createContractError() })
          return
        }
        set({ chartData: response.data, chartMeta: response.meta, chartLoading: false, chartError: null })
      })
      .catch((error: unknown) => {
        if (requestId !== chartRequestId || isAbortError(error)) return
        set({ chartData: null, chartMeta: null, chartLoading: false, chartError: asApiError(error) })
      })
      .finally(() => {
        if (requestId !== chartRequestId) return
        chartController = null
        chartMarketCode = null
        chartPromise = null
      })

    chartPromise = request
    return request
  },
  cancelPendingRequests: () => {
    clearRuntimeRequests()
    set({ searchLoading: false, chartLoading: false })
  },
  reset: () => {
    clearRuntimeRequests()
    set(initialState)
  },
}))
