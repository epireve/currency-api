import type { Country } from "../types"

export const countries: Country[] = [
  {
    code: "MY",
    name: "Malaysia",
    currency: "MYR",
    symbol: "RM",
    exchangeRates: {
      USD: 0.21,
      EUR: 0.19,
      GBP: 0.17
    }
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    symbol: "S$",
    exchangeRates: {
      USD: 0.74,
      EUR: 0.69,
      GBP: 0.59
    }
  },
  {
    code: "TH",
    name: "Thailand",
    currency: "THB",
    symbol: "฿",
    exchangeRates: {
      USD: 0.028,
      EUR: 0.026,
      GBP: 0.022
    }
  },
  {
    code: "ID",
    name: "Indonesia",
    currency: "IDR",
    symbol: "Rp",
    exchangeRates: {
      USD: 0.000064,
      EUR: 0.000059,
      GBP: 0.000051
    }
  },
  {
    code: "VN",
    name: "Vietnam",
    currency: "VND",
    symbol: "₫",
    exchangeRates: {
      USD: 0.000041,
      EUR: 0.000038,
      GBP: 0.000033
    }
  },
  {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    symbol: "₱",
    exchangeRates: {
      USD: 0.018,
      EUR: 0.016,
      GBP: 0.014
    }
  }
] 