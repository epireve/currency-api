import { useState, useEffect } from "react"
import { format } from "date-fns"

interface ExchangeRate {
  id: number
  date: string
  base_currency: string
  target_currency: string
  rate: number
  downloaded_at: string
}

interface AvailableDates {
  date: string
}

export function useExchangeRates(
  date: Date | undefined,
  baseCurrency: string,
  targetCurrency: string
) {
  const [rate, setRate] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  // Fetch available dates for the currency pair
  useEffect(() => {
    if (!baseCurrency || !targetCurrency) return

    const fetchDates = async () => {
      try {
        const response = await fetch("/api/exchange-rates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ baseCurrency, targetCurrency }),
        })

        if (!response.ok) {
          throw new Error("Failed to fetch available dates")
        }

        const data: AvailableDates[] = await response.json()
        setAvailableDates(data.map((d) => d.date))
      } catch (err) {
        console.error("Error fetching dates:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch dates")
      }
    }

    fetchDates()
  }, [baseCurrency, targetCurrency])

  // Fetch exchange rate for the selected date and currency pair
  useEffect(() => {
    if (!date || !baseCurrency || !targetCurrency) return

    const fetchRate = async () => {
      setLoading(true)
      setError(null)

      try {
        const formattedDate = format(date, "yyyy-MM-dd")
        const response = await fetch(
          `/api/exchange-rates?date=${formattedDate}&baseCurrency=${baseCurrency}&targetCurrency=${targetCurrency}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate")
        }

        const data = await response.json()
        setRate(data)
      } catch (err) {
        console.error("Error fetching rate:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch rate")
      } finally {
        setLoading(false)
      }
    }

    fetchRate()
  }, [date, baseCurrency, targetCurrency])

  return {
    rate,
    loading,
    error,
    availableDates,
  }
} 