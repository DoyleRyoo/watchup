import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errors'
import { SearchArea } from '../features/watchup/SearchArea'
import type { SearchCoinsResponse, SearchResult } from '../features/watchup/types'
import { useWatchupStore } from '../stores/watchupStore'

const featureApi = vi.hoisted(() => ({ searchCoins: vi.fn(), getCoinChart: vi.fn() }))
vi.mock('../features/watchup/api', () => featureApi)

const bitcoin: SearchResult = {
  marketCode: 'KRW-BTC',
  koreanName: '비트코인',
  englishName: 'Bitcoin',
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

beforeEach(() => {
  featureApi.searchCoins.mockReset().mockResolvedValue(response([]))
  featureApi.getCoinChart.mockReset()
  useWatchupStore.getState().reset()
})

afterEach(() => useWatchupStore.getState().reset())

describe('검색 실행과 상태', () => {
  it('trim한 검색어를 한 번 전달하고 서버 결과만 표시한다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin]))
    render(<SearchArea />)

    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '  비트코인  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    await screen.findByText('비트코인 (BTC)')
    expect(featureApi.searchCoins).toHaveBeenCalledOnce()
    expect(featureApi.searchCoins.mock.calls[0][0]).toBe('비트코인')
    expect(screen.getByText('KRW-BTC')).toBeInTheDocument()
  })

  it('진행 중 요청을 중복 전송하지 않고 빈 결과를 구분한다', async () => {
    const pending = deferred<SearchCoinsResponse>()
    featureApi.searchCoins.mockReturnValue(pending.promise)
    render(<SearchArea />)
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: '비트코인' } })
    fireEvent.submit(input.closest('form')!)
    fireEvent.submit(input.closest('form')!)

    expect(featureApi.searchCoins).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('코인을 검색하는 중입니다.')
    pending.resolve(response([]))
    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('늦은 이전 응답이 최신 검색 결과를 덮어쓰지 않는다', async () => {
    const first = deferred<SearchCoinsResponse>()
    const second = deferred<SearchCoinsResponse>()
    featureApi.searchCoins.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    render(<SearchArea />)
    const input = screen.getByRole('searchbox', { name: '코인명' })

    fireEvent.change(input, { target: { value: '비트' } })
    fireEvent.submit(input.closest('form')!)
    fireEvent.change(input, { target: { value: '리플' } })
    fireEvent.submit(input.closest('form')!)
    second.resolve(response([{ ...bitcoin, marketCode: 'KRW-XRP', koreanName: '리플', englishName: 'XRP' }]))
    await screen.findByText('리플 (XRP)')

    first.resolve(response([bitcoin]))
    await waitFor(() => expect(screen.queryByText('비트코인 (BTC)')).not.toBeInTheDocument())
    expect(featureApi.searchCoins.mock.calls[0][1].aborted).toBe(true)
  })

  it('오류 상세 대신 안전한 검색 실패 문구를 표시한다', async () => {
    featureApi.searchCoins.mockRejectedValue(new ApiError(503, 'UPBIT_UNAVAILABLE', '내부 상세'))
    render(<SearchArea />)
    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '비트코인' },
    })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('코인 검색에 실패했습니다.')
    expect(alert).not.toHaveTextContent('내부 상세')
    expect(useWatchupStore.getState().searchError?.code).toBe('UPBIT_UNAVAILABLE')
  })
})

describe('제거된 관심 기능', () => {
  it('검색 결과에 즐겨찾기·등록·삭제 control을 렌더링하지 않는다', async () => {
    featureApi.searchCoins.mockResolvedValue(response([bitcoin]))
    render(<SearchArea />)
    fireEvent.change(screen.getByRole('searchbox', { name: '코인명' }), {
      target: { value: '비트코인' },
    })
    fireEvent.click(screen.getByRole('button', { name: '검색' }))

    await screen.findByText('비트코인 (BTC)')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByLabelText(/관심|즐겨찾기|favorite|heart|star/i)).not.toBeInTheDocument()
  })
})
