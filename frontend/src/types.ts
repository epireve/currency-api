export interface Country {
  code: string
  name: string
  currency: string
  symbol: string
  exchangeRates: {
    USD: number
    EUR: number
    GBP: number
  }
} 