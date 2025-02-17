#!/usr/bin/env python3
"""
scrape_currency.py

A robust data scraper for historical exchange rate data from the currency-api.
It fetches data from April 2024 up to January 2025 for base currencies EUR, USD, and GBP.
The script uses asyncio and aiohttp for concurrency, Pydantic to enforce data validity,
and aiosqlite to store results in an SQLite database.
"""

import asyncio
import aiohttp
import aiosqlite
from datetime import datetime, timedelta
import logging
from pathlib import Path
from pydantic import BaseModel, ValidationError
from tqdm.asyncio import tqdm_asyncio
import json
import random
from typing import Dict, Optional

# ---------------------------
# Configure Logging
# ---------------------------
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
log_file = log_dir / f"scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler(log_file), logging.StreamHandler()],
)

logger = logging.getLogger(__name__)

# ---------------------------
# Configuration Variables
# ---------------------------
START_DATE = "2024-04-01"  # Updated start date
END_DATE = "2025-01-01"
BASE_CURRENCIES = ["EUR", "USD", "GBP"]
DB_PATH = "exchange_rates.db"
API_VERSION = "v1"  # Updated API version
CONCURRENT_REQUESTS = 5
RETRY_COUNT = 3
BATCH_SIZE = 50
MISSING_DATES_LOG = "missing_dates.log"


# ---------------------------
# Pydantic Model for Validation
# ---------------------------
class CurrencyRates(BaseModel):
    date: str
    gbp: Dict[str, float] | None = None
    eur: Dict[str, float] | None = None
    usd: Dict[str, float] | None = None


# ---------------------------
# Utility Functions
# ---------------------------
def daterange(start_date: datetime, end_date: datetime):
    """Generator to yield each day between two dates (inclusive)."""
    for n in range((end_date - start_date).days + 1):
        yield start_date + timedelta(days=n)


async def fetch_with_retry(
    url: str, session: aiohttp.ClientSession, retries: int = RETRY_COUNT
) -> Optional[dict]:
    """Fetch JSON data from a URL using retries with exponential backoff."""
    for attempt in range(1, retries + 1):
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                elif response.status == 404:
                    logger.warning(f"URL not found (404): {url}")
                    return None
                else:
                    logger.error(f"Error {response.status} fetching {url}")
        except Exception as e:
            logger.error(f"Exception on attempt {attempt} for {url}: {e}")
            if attempt == retries:
                return None

        # Exponential backoff with jitter
        delay = (2**attempt) + (random.random() * 0.1)
        await asyncio.sleep(delay)
    return None


async def init_db():
    """Initialize the SQLite database with the required table."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT,
                base_currency TEXT,
                target_currency TEXT,
                rate REAL,
                downloaded_at TEXT,
                UNIQUE(date, base_currency, target_currency)
            )
        """
        )
        # Create index for faster lookups
        await db.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_date_currency 
            ON exchange_rates(date, base_currency, target_currency)
        """
        )
        await db.commit()


async def check_already_scraped(db: aiosqlite.Connection, date: str, base: str) -> bool:
    """Check if data for a given date and base currency is already in the database."""
    async with db.execute(
        "SELECT COUNT(*) FROM exchange_rates WHERE date = ? AND base_currency = ?",
        (date, base),
    ) as cursor:
        row = await cursor.fetchone()
        return row[0] > 0


async def save_rates_batch(db: aiosqlite.Connection, rates_data: list):
    """Save a batch of exchange rates into the database."""
    if not rates_data:
        return

    try:
        await db.executemany(
            """
            INSERT OR REPLACE INTO exchange_rates 
            (date, base_currency, target_currency, rate, downloaded_at)
            VALUES (?, ?, ?, ?, ?)
        """,
            rates_data,
        )
        await db.commit()
    except Exception as e:
        logger.error(f"Error saving batch to database: {e}")
        await db.rollback()


async def scrape_date(
    date: str,
    base: str,
    session: aiohttp.ClientSession,
    db: aiosqlite.Connection,
    semaphore: asyncio.Semaphore,
) -> Optional[list]:
    """
    Scrape the exchange rate for a specific date and base currency.
    Returns a list of tuples ready for database insertion or None if failed.
    """
    async with semaphore:
        # Skip if we've already scraped this date and base currency
        if await check_already_scraped(db, date, base):
            logger.debug(f"Data for {date} with base {base} already exists. Skipping.")
            return None

        # Use the correct API URL format
        url = f"https://{date}.currency-api.pages.dev/{API_VERSION}/currencies/{base.lower()}.json"
        data = await fetch_with_retry(url, session)

        if data is None:
            logger.error(f"Failed to fetch data for {date} and base {base}")
            return None

        # Validate the fetched data using Pydantic
        try:
            validated = CurrencyRates(**data)
            rates = getattr(validated, base.lower())
            if not rates:
                logger.error(f"No rates found for {date} and base {base}")
                return None
        except ValidationError as e:
            logger.error(f"Data validation error for {date} and base {base}: {e}")
            return None
        except AttributeError as e:
            logger.error(f"Invalid base currency {base} in response: {e}")
            return None

        # Prepare data for batch insertion
        downloaded_at = datetime.now().isoformat()
        return [
            (date, base, target, rate, downloaded_at) for target, rate in rates.items()
        ]


# ---------------------------
# Main Asynchronous Function
# ---------------------------
async def main():
    """Main function to coordinate the scraping process."""
    try:
        # Initialize database
        await init_db()

        # Setup dates
        start_date_obj = datetime.strptime(START_DATE, "%Y-%m-%d")
        end_date_obj = datetime.strptime(END_DATE, "%Y-%m-%d")
        dates = list(daterange(start_date_obj, end_date_obj))

        # Calculate total operations for progress bar
        total_operations = len(dates) * len(BASE_CURRENCIES)
        logger.info(
            f"Starting scraping for {total_operations} date-currency combinations"
        )

        # Track missing dates
        missing_dates = set()

        # Create connection pool and semaphore for rate limiting
        async with aiohttp.ClientSession() as session, aiosqlite.connect(DB_PATH) as db:
            semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
            batch_data = []

            async for current_date in tqdm_asyncio(dates):
                date_str = current_date.strftime("%Y-%m-%d")

                # Create tasks for each base currency
                tasks = [
                    scrape_date(date_str, base, session, db, semaphore)
                    for base in BASE_CURRENCIES
                ]

                # Wait for all tasks for this date to complete
                results = await asyncio.gather(*tasks, return_exceptions=True)

                # Process results
                all_failed = True
                for base, result in zip(BASE_CURRENCIES, results):
                    if isinstance(result, Exception):
                        logger.error(
                            f"Task failed with error for {date_str} {base}: {result}"
                        )
                        continue
                    if result:  # If we got valid data
                        all_failed = False
                        batch_data.extend(result)

                        # If batch is full, save it
                        if len(batch_data) >= BATCH_SIZE:
                            await save_rates_batch(db, batch_data)
                            batch_data = []

                if all_failed:
                    missing_dates.add(date_str)

            # Save any remaining data
            if batch_data:
                await save_rates_batch(db, batch_data)

            # Log missing dates
            if missing_dates:
                with open(MISSING_DATES_LOG, "w") as f:
                    for date in sorted(missing_dates):
                        f.write(f"{date}\n")
                logger.info(
                    f"Logged {len(missing_dates)} missing dates to {MISSING_DATES_LOG}"
                )

    except Exception as e:
        logger.error(f"Main process failed: {e}")
        raise
    finally:
        logger.info("Scraping process completed")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user. Exiting gracefully.")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
