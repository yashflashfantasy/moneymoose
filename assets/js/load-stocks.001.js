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

    // Show top 30 results for speed
    results.slice(0, 30).forEach((item) => {
      const nameHighlighted = highlightText(item.name || "N/A", query);
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
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4RkE4R0giLCJqdGkiOiI2OTM3ODcyYThlOTI1Njc0NDcyNDU4MzMiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc2NTI0Njc2MiwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzY1MzE3NjAwfQ.bpLdPN7b7tYz4na8mLTigHUNmd85Qjoo0SrNpBG4gdg";
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