import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { SearchArea } from '../features/watchup/SearchArea'
import type { SearchCoinsResponse, SearchResult } from '../features/watchup/types'
import { useWatchupStore } from '../stores/watchupStore'

const featureApi = vi.hoisted(() => ({ searchCoins: vi.fn() }))
vi.mock('../features/watchup/api', () => featureApi)

const bitcoin: SearchResult = {
  marketCode: 'KRW-BTC',
  koreanName: '비트코인',
  englishName: 'Bitcoin',
  status: 'ACTIVE',
}
const ripple: SearchResult = {
  marketCode: 'KRW-XRP',
  koreanName: '리플',
  englishName: 'XRP',
  status: 'ACTIVE',
}

function response(data: SearchResult[]): SearchCoinsResponse {
  return { data, meta: { count: data.length } }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function Destination() {
  const { marketCode } = useParams()
  return <p>도착: {marketCode}</p>
}

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SearchArea />} />
        <Route path="/coins/:marketCode" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  featureApi.searchCoins.mockReset().mockResolvedValue(response([]))
  useWatchupStore.getState().reset()
})

afterEach(() => useWatchupStore.getState().reset())

describe('연관 검색과 이동', () => {
  it('입력 변경을 debounce해 검색하고 첫 결과를 자동 선택한다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin, ripple]))
    renderSearch()

    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '  비트  ' },
    })

    await waitFor(() => expect(featureApi.searchCoins).toHaveBeenCalledOnce())
    expect(featureApi.searchCoins.mock.calls[0][0]).toBe('비트')
    const options = await screen.findAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('새 결과 목록은 이전 키보드 선택과 무관하게 첫 항목을 선택한다', async () => {
    featureApi.searchCoins
      .mockResolvedValueOnce(response([bitcoin, ripple]))
      .mockResolvedValueOnce(response([bitcoin, ripple]))
    renderSearch()
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: '코인' } })
    let options = await screen.findAllByRole('option')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options[1]).toHaveAttribute('aria-selected', 'true')

    fireEvent.change(input, { target: { value: '코인명' } })
    await waitFor(() => expect(featureApi.searchCoins).toHaveBeenCalledTimes(2))
    options = await screen.findAllByRole('option')

    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('방향키로 선택한 API 결과의 marketCode로 Enter 이동한다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin, ripple]))
    renderSearch()
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: '코인' } })
    await screen.findAllByRole('option')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(await screen.findByText('도착: KRW-XRP')).toBeInTheDocument()
  })

  it('연관 검색어 클릭 시 그 결과의 route로 이동한다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin]))
    renderSearch()

    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '비트코인' },
    })
    fireEvent.click(await screen.findByRole('option', { name: /비트코인/ }))

    expect(await screen.findByText('도착: KRW-BTC')).toBeInTheDocument()
  })

  it('결과가 없으면 안내하고 Enter로 입력값을 추측해 이동하지 않는다', async () => {
    renderSearch()
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: 'btc' } })
    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(screen.getByRole('searchbox', { name: '코인명' })).toBeInTheDocument()
    expect(screen.queryByText(/도착:/)).not.toBeInTheDocument()
  })

  it('늦은 이전 응답이 최신 검색 결과를 덮어쓰지 않는다', async () => {
    const first = deferred<SearchCoinsResponse>()
    const second = deferred<SearchCoinsResponse>()
    featureApi.searchCoins.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    renderSearch()
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: '비트' } })
    await waitFor(() => expect(featureApi.searchCoins).toHaveBeenCalledTimes(1))
    fireEvent.change(input, { target: { value: '리플' } })
    await waitFor(() => expect(featureApi.searchCoins).toHaveBeenCalledTimes(2))

    second.resolve(response([ripple]))
    expect(await screen.findByRole('option', { name: /리플/ })).toBeInTheDocument()
    first.resolve(response([bitcoin]))

    await waitFor(() => expect(screen.queryByRole('option', { name: /비트코인/ })).not.toBeInTheDocument())
    expect(featureApi.searchCoins.mock.calls[0][1].aborted).toBe(true)
  })

  it('오류 상세 대신 안전한 검색 실패 문구를 표시한다', async () => {
    featureApi.searchCoins.mockRejectedValue(new ApiError(503, 'UPBIT_UNAVAILABLE', '내부 상세'))
    renderSearch()

    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '비트코인' },
    })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('코인 검색에 실패했습니다.')
    expect(alert).not.toHaveTextContent('내부 상세')
    expect(useWatchupStore.getState().searchError?.code).toBe('UPBIT_UNAVAILABLE')
  })
})

describe('제거된 관심 기능', () => {
  it('검색 결과에 즐겨찾기·등록·삭제 control을 렌더링하지 않는다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin]))
    renderSearch()
    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '비트코인' },
    })

    await screen.findByRole('option', { name: /비트코인/ })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/관심|즐겨찾기|favorite|heart|star/i)).not.toBeInTheDocument()
  })
})
