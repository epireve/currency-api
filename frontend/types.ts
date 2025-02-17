export type Country = {
  name: string
  code: string
  currency: string
  symbol: string
  exchangeRates: {
    EUR: number
    USD: number
    GBP: number
  }
}

