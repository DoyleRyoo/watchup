import { useEffect, type FormEvent } from 'react'
import { useWatchupStore } from '../../stores/watchupStore'
import type { SearchResult } from './types'

const SEARCH_ERROR_LINES = ['코인 검색에 실패했습니다.', '잠시 후 다시 시도해주세요.']

function displaySymbol(marketCode: string): string {
  return marketCode.startsWith('KRW-') && marketCode.length > 4
    ? marketCode.slice(4)
    : marketCode
}

function SearchResultItem({ result }: { result: SearchResult }) {
  return (
    <li className="search-result-item">
      <div>
        <strong>{result.koreanName} ({displaySymbol(result.marketCode)})</strong>
        <span>{result.marketCode}</span>
      </div>
    </li>
  )
}

function Message({ lines }: { lines: string[] }) {
  return <div role="alert" className="status-message error-message">
    {lines.map((line) => <p key={line}>{line}</p>)}
  </div>
}

export function SearchArea() {
  const searchQuery = useWatchupStore((state) => state.searchQuery)
  const searchResults = useWatchupStore((state) => state.searchResults)
  const searchLoading = useWatchupStore((state) => state.searchLoading)
  const searchError = useWatchupStore((state) => state.searchError)
  const hasSearched = useWatchupStore((state) => state.hasSearched)
  const setSearchQuery = useWatchupStore((state) => state.setSearchQuery)
  const submitSearch = useWatchupStore((state) => state.submitSearch)
  const cancelSearchRequest = useWatchupStore((state) => state.cancelSearchRequest)

  useEffect(() => cancelSearchRequest, [cancelSearchRequest])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submitSearch()
  }

  return (
    <section className="search-area" aria-labelledby="search-title">
      <h2 id="search-title">코인 검색</h2>
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="coin-search">코인명</label>
        <div className="search-controls">
          <input
            id="coin-search"
            name="query"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="코인명을 입력하세요."
          />
          <button type="submit" disabled={searchLoading || !searchQuery.trim()}>검색</button>
        </div>
      </form>

      {searchLoading && <p role="status" className="status-message">코인을 검색하는 중입니다.</p>}
      {searchError && <Message lines={SEARCH_ERROR_LINES} />}
      {!searchLoading && !searchError && hasSearched && searchResults.length === 0
        && <p className="status-message">검색 결과가 없습니다.</p>}
      {searchResults.length > 0 && <ul className="search-results">
        {searchResults.map((result) => <SearchResultItem key={result.marketCode} result={result} />)}
      </ul>}
    </section>
  )
}
