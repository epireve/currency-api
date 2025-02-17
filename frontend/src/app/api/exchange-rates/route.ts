import { NextResponse } from "next/server"
import sqlite3 from "sqlite3"
import { open } from "sqlite"

// Initialize database connection
async function openDb() {
  return open({
    filename: "../exchange_rates.db",
    driver: sqlite3.Database
  })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const baseCurrency = searchParams.get("baseCurrency")
    const targetCurrency = searchParams.get("targetCurrency")

    if (!date || !baseCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const db = await openDb()
    
    // Get the exchange rate for the specific date and currency pair
    const rate = await db.get(
      `SELECT * FROM exchange_rates 
       WHERE date = ? 
       AND base_currency = ? 
       AND target_currency = ?
       ORDER BY downloaded_at DESC
       LIMIT 1`,
      [date, baseCurrency, targetCurrency]
    )

    if (!rate) {
      return NextResponse.json(
        { error: "Exchange rate not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get all available dates for a currency pair
export async function POST(request: Request) {
  try {
    const { baseCurrency, targetCurrency } = await request.json()

    if (!baseCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const db = await openDb()
    
    // Get all available dates for the currency pair
    const dates = await db.all(
      `SELECT DISTINCT date 
       FROM exchange_rates 
       WHERE base_currency = ? 
       AND target_currency = ?
       ORDER BY date DESC`,
      [baseCurrency, targetCurrency]
    )

    return NextResponse.json(dates)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 