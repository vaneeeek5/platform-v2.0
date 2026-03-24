import axios from 'axios'

const METRIKA_API = 'https://api-metrika.yandex.net/stat/v1'

function getClient(token: string) {
  return axios.create({
    baseURL: METRIKA_API,
    headers: {
      Authorization: `OAuth ${token}`,
    },
  })
}

export type MetrikaGoal = {
  id: number
  name: string
  type: string
}

export type MetrikaConversion = {
  date: string
  goal_id: string
  conversions: number
  revenue: number
}

export async function getGoals(token: string, counterId: string): Promise<MetrikaGoal[]> {
  const client = getClient(token)
  const res = await client.get(`/management/v1/counter/${counterId}/goals`)
  return res.data.goals || []
}

export async function getConversions(
  token: string,
  counterId: string,
  dateFrom: string,
  dateTo: string,
  goalIds: string[]
): Promise<MetrikaConversion[]> {
  const client = getClient(token)
  const res = await client.get('/data', {
    params: {
      ids: counterId,
      metrics: 'ym:s:goalReachesAny,ym:s:goalConversionAny',
      dimensions: 'ym:s:date,ym:s:lastSignGoalNameAny',
      date1: dateFrom,
      date2: dateTo,
      goal_id: goalIds.join(','),
      limit: 10000,
    },
  })

  return (res.data.data || []).map((row: { dimensions: { name: string }[]; metrics: number[] }) => ({
    date: row.dimensions[0]?.name,
    goal_id: row.dimensions[1]?.name,
    conversions: row.metrics[0] || 0,
    revenue: row.metrics[1] || 0,
  }))
}

export async function getLeads(
  token: string,
  counterId: string,
  dateFrom: string,
  dateTo: string
): Promise<Record<string, unknown>[]> {
  const client = getClient(token)
  const res = await client.get('/data', {
    params: {
      ids: counterId,
      metrics: 'ym:s:visits',
      dimensions: 'ym:s:date,ym:s:lastSignUTMSource,ym:s:lastSignUTMMedium,ym:s:lastSignUTMCampaign,ym:s:lastSignGoalNameAny',
      date1: dateFrom,
      date2: dateTo,
      limit: 10000,
    },
  })
  return res.data.data || []
}
