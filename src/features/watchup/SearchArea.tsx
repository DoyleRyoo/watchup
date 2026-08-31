import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWatchupStore } from '../../stores/watchupStore'
import type { SearchResult } from './types'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_ERROR_LINES = ['코인 검색에 실패했습니다.', '잠시 후 다시 시도해주세요.']

function displaySymbol(marketCode: string): string {
  return marketCode.startsWith('KRW-') && marketCode.length > 4
    ? marketCode.slice(4)
    : marketCode
}

function Message({ lines }: { lines: string[] }) {
  return <div role="alert" className="status-message error-message">
    {lines.map((line) => <p key={line}>{line}</p>)}
  </div>
}

export function SearchArea() {
  const navigate = useNavigate()
  const [selection, setSelection] = useState<{
    results: SearchResult[]
    marketCode: string
  } | null>(null)
  const searchQuery = useWatchupStore((state) => state.searchQuery)
  const searchResults = useWatchupStore((state) => state.searchResults)
  const searchLoading = useWatchupStore((state) => state.searchLoading)
  const searchError = useWatchupStore((state) => state.searchError)
  const hasSearched = useWatchupStore((state) => state.hasSearched)
  const setSearchQuery = useWatchupStore((state) => state.setSearchQuery)
  const submitSearch = useWatchupStore((state) => state.submitSearch)
  const cancelSearchRequest = useWatchupStore((state) => state.cancelSearchRequest)

  useEffect(() => {
    if (!searchQuery.trim()) return
    const timer = window.setTimeout(() => void submitSearch(), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchQuery, submitSearch])

  useEffect(() => cancelSearchRequest, [cancelSearchRequest])

  const storedIndex = selection?.results === searchResults
    ? searchResults.findIndex((result) => result.marketCode === selection.marketCode)
    : -1
  const selectedIndex = searchResults.length === 0 ? -1 : Math.max(0, storedIndex)

  const navigateToResult = (result: SearchResult) => {
    navigate(`/coins/${result.marketCode}`)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (searchResults.length > 0) {
        const nextIndex = (selectedIndex + 1) % searchResults.length
        setSelection({ results: searchResults, marketCode: searchResults[nextIndex].marketCode })
      }
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (searchResults.length > 0) {
        const nextIndex = selectedIndex <= 0 ? searchResults.length - 1 : selectedIndex - 1
        setSelection({ results: searchResults, marketCode: searchResults[nextIndex].marketCode })
      }
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const selected = searchResults[selectedIndex]
      if (selected) navigateToResult(selected)
    }
  }

  return (
    <section className="search-area" aria-labelledby="search-title">
      <h2 id="search-title">코인 검색</h2>
      <label htmlFor="coin-search">코인명</label>
      <input
        id="coin-search"
        name="query"
        type="search"
        role="searchbox"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="코인명을 입력하세요."
        autoComplete="off"
        aria-controls="coin-search-results"
        aria-activedescendant={selectedIndex >= 0 ? `coin-search-result-${selectedIndex}` : undefined}
      />

      {searchLoading && <p role="status" className="status-message">코인을 검색하는 중입니다.</p>}
      {searchError && <Message lines={SEARCH_ERROR_LINES} />}
      {!searchLoading && !searchError && hasSearched && searchResults.length === 0
        && <p className="status-message">검색 결과가 없습니다.</p>}
      {searchResults.length > 0 && (
        <ul id="coin-search-results" className="search-results" role="listbox">
          {searchResults.map((result, index) => (
            <li
              id={`coin-search-result-${index}`}
              key={result.marketCode}
              className={`search-result-item${index === selectedIndex ? ' selected' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => navigateToResult(result)}
            >
              <strong>{result.koreanName} ({displaySymbol(result.marketCode)})</strong>
              <span>{result.marketCode}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
