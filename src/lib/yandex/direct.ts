import axios from 'axios'

const DIRECT_API = 'https://api.direct.yandex.com/json/v5'
const OAUTH_TOKEN = process.env.YANDEX_DIRECT_TOKEN!

const client = axios.create({
  baseURL: DIRECT_API,
  headers: {
    Authorization: `Bearer ${OAUTH_TOKEN}`,
    'Client-Login': 'agrom',
    'Accept-Language': 'ru',
  },
})

export type DirectCampaignStat = {
  date: string
  campaignId: string
  campaignName: string
  clicks: number
  impressions: number
  spend: number
  cpc: number
  ctr: number
}

export async function getCampaignStats(
  dateFrom: string,
  dateTo: string
): Promise<DirectCampaignStat[]> {
  const body = {
    method: 'get',
    params: {
      SelectionCriteria: {
        DateFrom: dateFrom,
        DateTo: dateTo,
      },
      Goals: [],
      AttributionModels: [],
      ReportName: `stat_${dateFrom}_${dateTo}`,
      ReportType: 'CAMPAIGN_PERFORMANCE_REPORT',
      DateRangeType: 'CUSTOM_DATE',
      Format: 'TSV',
      IncludeVAT: 'YES',
      IncludeDiscount: 'YES',
      FieldNames: ['Date', 'CampaignId', 'CampaignName', 'Clicks', 'Impressions', 'Cost', 'AvgCpc', 'Ctr'],
    },
  }

  const res = await client.post('/reports', body)
  const lines: string[] = res.data.split('\n').filter(Boolean)
  // Skip header
  const headers = lines[0].split('\t')
  const rows = lines.slice(1)

  return rows
    .filter((l) => !l.startsWith('Total'))
    .map((line) => {
      const cols = line.split('\t')
      const get = (field: string) => cols[headers.indexOf(field)] || ''
      return {
        date: get('Date'),
        campaignId: get('CampaignId'),
        campaignName: get('CampaignName'),
        clicks: parseInt(get('Clicks')) || 0,
        impressions: parseInt(get('Impressions')) || 0,
        spend: parseFloat(get('Cost')) || 0,
        cpc: parseFloat(get('AvgCpc')) || 0,
        ctr: parseFloat(get('Ctr')) || 0,
      }
    })
}

export async function getCampaigns(): Promise<{ id: string; name: string; status: string }[]> {
  const res = await client.post('', {
    method: 'get',
    params: {
      SelectionCriteria: {},
      FieldNames: ['Id', 'Name', 'Status'],
    },
    service: 'campaigns',
  })
  return (res.data.result?.Campaigns || []).map((c: { Id: string; Name: string; Status: string }) => ({
    id: String(c.Id),
    name: c.Name,
    status: c.Status,
  }))
}
