let instruments = [];
let dataLoaded = false;

fetch("complete.json")
  .then((res) => res.json())
  .then((data) => {
    instruments = data;
    dataLoaded = true;
    document.getElementById("resultsContainer").innerHTML =
      '<div class="no-results">Start typing to search...</div>';
  })
  .catch((err) => {
    console.error("Error loading JSON:", err);
    document.getElementById("resultsContainer").innerHTML =
      '<div class="no-results text-danger">Failed to load data.</div>';
  });

function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("searchInput");
  const resultsContainer = document.getElementById("resultsContainer");

  input.addEventListener("input", function () {
    const query = this.value.trim().toLowerCase();
    resultsContainer.innerHTML = "";

    if (!dataLoaded) {
      resultsContainer.innerHTML =
        '<div class="loader">Please wait, loading data...</div>';
      return;
    }

    if (query.length < 2) {
      resultsContainer.innerHTML = `<div class="no-results">Type at least 2 letters...</div>`;
      return;
    }

    // Search efficiently
    const results = instruments.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.trading_symbol &&
          item.trading_symbol.toLowerCase().includes(query)) ||
        (item.isin && item.isin.toLowerCase().includes(query)) ||
        (item.exchange && item.exchange.toLowerCase().includes(query))
    );

    if (results.length === 0) {
      resultsContainer.innerHTML = `<div class="no-results">No matches found</div>`;
      return;
    }

    // Sort results by expiry date
    const now = Date.now();
    const sortedResults = results.sort((a, b) => {
      const expiryA = a.expiry || 0;
      const expiryB = b.expiry || 0;

      // If neither has expiry, maintain original order
      if (!expiryA && !expiryB) return 0;
      
      // Items without expiry go to the end
      if (!expiryA) return 1;
      if (!expiryB) return -1;

      const isExpiredA = expiryA < now;
      const isExpiredB = expiryB < now;

      // Both expired: sort by expiry date (most recent expired first)
      if (isExpiredA && isExpiredB) {
        return expiryB - expiryA;
      }

      // One expired, one not: non-expired comes first
      if (isExpiredA) return 1;
      if (isExpiredB) return -1;

      // Both not expired: sort by nearest expiry first
      return expiryA - expiryB;
    });

    // Show top 30 results for speed
    sortedResults.slice(0, 30).forEach((item) => {
      const nameHighlighted = highlightText(item.name || "N/A", query);
      
      // Format expiry date if available
      let expiryInfo = "";
      if (item.expiry) {
        const expiryDate = new Date(item.expiry);
        const isExpired = item.expiry < now;
        const dateStr = expiryDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        expiryInfo = `<div><small><b>Expiry:</b> ${dateStr}${isExpired ? ' <span style="color: #e74c3c;">(Expired)</span>' : ''}</small></div>`;
      }

      const html = `
      <div class="result-item" instrument-key="${item.instrument_key}" trading-symbol="${item.trading_symbol}" lot-size="${item.lot_size}">
        <strong>${nameHighlighted}</strong>
        <em>${item.segment || "Unknown"} • ${item.exchange || ""} • ${
        item.instrument_type || ""
      }</em>
        ${
          item.trading_symbol
            ? `<div><small><b>Symbol:</b> ${item.trading_symbol}</small></div>`
            : ""
        }
        ${
          item.isin ? `<div><small><b>ISIN:</b> ${item.isin}</small></div>` : ""
        }
        ${expiryInfo}
      </div>
    `;
      resultsContainer.insertAdjacentHTML("beforeend", html);
    });
  });
});

// Attach click listeners after rendering results
resultsContainer.addEventListener("click", async (e) => {
  const item = e.target.closest(".result-item");
  if (!item) return;

  const instrumentKey = item.getAttribute("instrument-key");
  const tradingSymbol = item.getAttribute("trading-symbol");
  const lotSize = item.getAttribute("lot-size");

  // Fetch latest price from Upstox Sandbox API
  const accessToken =
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0U0NQN1oiLCJqdGkiOiI2OThlOWI0NTFhMzhhYzdlZTIwYTNhZTAiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzcwOTUzNTQxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NzEwMjAwMDB9.RNVBac4FdvOMSbYI2I_J3HKlcca-W_QixobZ8ybmXRM";
  const priceData = await fetchLatestPrice(instrumentKey, accessToken);
  const contracts = await fetchOptionContracts(instrumentKey, accessToken);

  // Combine instrument details with latest price
  const instrumentInfo = {
    instrument_key: instrumentKey,
    name: item.querySelector("strong")?.innerText || "Unknown",
    details: priceData?.data,
    bought_at: '-',
    exit_at:'-',
    trading_symbol: tradingSymbol,
    lot_size: lotSize,
    contracts: contracts,
    timestamp: Date.now(),
  };

  // Save to IndexedDB
  await saveInstrumentToDB(instrumentInfo);
  console.log(
    `✅ Saved ${instrumentInfo.name} to IndexedDB with price ${
      instrumentInfo.last_price || "N/A"
    }`
  );
  // Clear search input and results
  // input.value = '';
  resultsContainer.innerHTML = "";
  await populateTable();
});