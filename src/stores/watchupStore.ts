import { create } from 'zustand'
import { ApiError, createContractError } from '../api/errors'
import { searchCoins } from '../features/watchup/api'
import type { SearchResult } from '../features/watchup/types'

type WatchupDataState = {
  searchQuery: string
  searchResults: SearchResult[]
  searchLoading: boolean
  searchError: ApiError | null
  hasSearched: boolean
}

type WatchupActions = {
  setSearchQuery: (query: string) => void
  submitSearch: () => Promise<void>
  cancelSearchRequest: () => void
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
}

let searchRequestId = 0
let searchController: AbortController | null = null

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
}

export const useWatchupStore = create<WatchupState>((set, get) => ({
  ...initialState,
  setSearchQuery: (searchQuery) => {
    if (searchQuery === get().searchQuery) return
    invalidateSearchRequest()
    set({
      searchQuery,
      searchResults: [],
      searchLoading: false,
      searchError: null,
      hasSearched: false,
    })
  },
  submitSearch: () => {
    const normalizedQuery = get().searchQuery.trim()
    if (!normalizedQuery) {
      invalidateSearchRequest()
      set({
        searchResults: [],
        searchLoading: false,
        searchError: null,
        hasSearched: false,
      })
      return Promise.resolve()
    }

    invalidateSearchRequest()
    const requestId = searchRequestId
    const controller = new AbortController()
    searchController = controller
    set({
      searchResults: [],
      searchLoading: true,
      searchError: null,
      hasSearched: false,
    })

    return searchCoins(normalizedQuery, controller.signal)
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
        if (requestId === searchRequestId) searchController = null
      })
  },
  cancelSearchRequest: () => {
    invalidateSearchRequest()
    set({ searchLoading: false })
  },
  cancelPendingRequests: () => {
    invalidateSearchRequest()
    set({ searchLoading: false })
  },
  reset: () => {
    invalidateSearchRequest()
    set(initialState)
  },
}))
