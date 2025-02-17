import type { Country } from "../types"

export const countries: Country[] = [
  {
    name: "Malaysia",
    code: "MY",
    currency: "MYR",
    symbol: "RM",
    exchangeRates: {
      EUR: 0.2, // 1 MYR = 0.20 EUR
      USD: 0.21, // 1 MYR = 0.21 USD
      GBP: 0.17, // 1 MYR = 0.17 GBP
    },
  },
  {
    name: "Singapore",
    code: "SG",
    currency: "SGD",
    symbol: "S$",
    exchangeRates: {
      EUR: 0.69,
      USD: 0.74,
      GBP: 0.59,
    },
  },
  {
    name: "Vietnam",
    code: "VN",
    currency: "VND",
    symbol: "₫",
    exchangeRates: {
      EUR: 0.000038,
      USD: 0.000041,
      GBP: 0.000033,
    },
  },
  {
    name: "Indonesia",
    code: "ID",
    currency: "IDR",
    symbol: "Rp",
    exchangeRates: {
      EUR: 0.00006,
      USD: 0.000064,
      GBP: 0.000051,
    },
  },
  {
    name: "Thailand",
    code: "TH",
    currency: "THB",
    symbol: "฿",
    exchangeRates: {
      EUR: 0.026,
      USD: 0.028,
      GBP: 0.022,
    },
  },
  {
    name: "Philippines",
    code: "PH",
    currency: "PHP",
    symbol: "₱",
    exchangeRates: {
      EUR: 0.017,
      USD: 0.018,
      GBP: 0.014,
    },
  },
]

