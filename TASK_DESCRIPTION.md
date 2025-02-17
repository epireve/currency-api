# Currency Data Scraping Project

## Overview

We will be scraping historical exchange rate data from the [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) repository. The data source provides up-to-date and historical currency rates through a JSON API with a fallback mechanism. Our focus is on extracting Southeast Asian currency data from January 2010 until January 2025.

## Project Goals

- **Extract Historical Data:** Scrape exchange rate data over the period January 2010 - January 2025.
- **Base Currencies:** Utilize Euro (EUR), US Dollar (USD), and Great British Pound (GBP) as the base currencies for conversion.
- **Concurrency:** Implement Python concurrency (using asyncio and aiohttp) to efficiently fetch data over the large date range.
- **Data Validation:** Use Pydantic models to validate and structure incoming JSON data.
- **Database Storage:** Design a singular, unified database schema to store the exchange rates without separating by currency, which simplifies queries and maintenance.

## Data Source Details

- **Primary URL:**
  - `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/{apiVersion}/currencies/{base}.json`
- **Fallback URL:**
  - `https://{date}.currency-api.pages.dev/{apiVersion}/currencies/{base}.json`

The API supports dates in `YYYY-MM-DD` format or a special `latest` keyword. The data returned is in JSON (or minified JSON) format.

## Implementation Strategy

### 1. Python Concurrency

- **Approach:** Use Python's `asyncio` along with libraries like `aiohttp` to make concurrent HTTP requests. This allows us to perform multiple network requests simultaneously, greatly reducing the total scraping time.
- **Techniques:**
  - Use `asyncio.gather` to schedule multiple fetch operations concurrently.
  - Implement rate limiting if necessary to avoid overwhelming the API.
  - Ensure proper error handling and retries (with exponential backoff) for network failures.

### 2. Data Validation with Pydantic

- **Purpose:** Use Pydantic to define models that mirror the expected JSON structure. This ensures that the data is correctly structured, and any inconsistencies or missing fields are caught early.
- **Example Model:**

```python
from pydantic import BaseModel
from typing import Dict

class CurrencyRates(BaseModel):
    base: str
    date: str  # YYYY-MM-DD
    rates: Dict[str, float]
```

### 3. Database Schema Design

We will use a single table to store all exchange rate data. This unified schema simplifies queries and maintenance. Below is the suggested schema for a relational database (e.g., PostgreSQL):

- **Table Name:** exchange_rates

| Column Name    | Data Type   | Description |
| -------------- | ----------- | ----------- |
| id             | SERIAL/INT  | Primary key |
| date           | DATE        | The date of the exchange rate |
| base_currency  | VARCHAR(3)  | Base currency code (EUR, USD, GBP) |
| target_currency| VARCHAR(3)  | Target currency code (e.g., IDR, THB, VND, etc.) |
| rate           | DECIMAL     | The exchange rate value |
| downloaded_at  | TIMESTAMP   | Timestamp when the data was fetched |

- **Indexes:** Create indexes on (date, base_currency, target_currency) for faster lookups.

### 4. Edge Cases & Use Cases

- **Network Failures:**
  - Implement retry logic with exponential backoff if a request fails.
- **Data Inconsistencies:**
  - Validate response data using Pydantic models to catch missing or malformed data.
- **Missing Data:**
  - Log and monitor missing dates or incomplete data responses, and consider re-fetching them.
- **Fallback Mechanism:**
  - If fetching data from the primary URL fails, automatically switch to the fallback URL.
- **Performance:**
  - Limit the number of concurrent requests to prevent system overload and potential API restrictions.
- **Logging:**
  - Maintain detailed logs for successes, failures, and retries to ensure transparency in data processing.

## Implementation Steps

1. **Research:**
   - Study the [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api) repository to understand available endpoints and data formats.
2. **Concurrency Module:**
   - Develop an asynchronous module in Python to fetch data concurrently for each day within the target range.
3. **Data Validation:**
   - Use Pydantic models to validate and parse the JSON responses.
4. **Database Setup:**
   - Design and initialize a relational database with the proposed schema.
5. **Data Storage:**
   - Implement the logic to insert validated data into the database.
6. **Error Handling & Logging:**
   - Incorporate robust error handling and logging to manage retries and report failures.
7. **Testing:**
   - Write unit tests for fetching, validation, and database insertion to ensure the robustness of the pipeline.

## Additional Considerations

- **Caching:** Consider caching responses to avoid duplicate fetches if the process is re-run.
- **Configuration:** Use environment variables or configuration files to manage API URLs, concurrency limits, and database connection settings.
- **Continuous Updates:** If new data becomes available, plan for scheduled updates to refresh the dataset.

## References

- [fawazahmed0/exchange-api Repository](https://github.com/fawazahmed0/exchange-api)
- [Python asyncio Documentation](https://docs.python.org/3/library/asyncio.html)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [Database Schema Design Best Practices](https://www.postgresql.org/docs/current/index.html)

## Conclusion

This project involves a comprehensive data scraping pipeline to collect historical exchange rate data using Python concurrency and Pydantic for validation. The proposed unified database schema is designed to efficiently store all the required currency data while being flexible enough to accommodate future extensions or additional error handling. This approach will ensure a robust, efficient, and maintainable solution for historical exchange rate data ingestion.
