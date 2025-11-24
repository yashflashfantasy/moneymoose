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
    "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTIzYWM4MDU0ZDU3NTI1YTFiNGY3NDciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzYzOTQ1NjAwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQwMjE2MDB9.AoV-lyuWg8pnJD-i_FvkyObsTPcGzRl4CHmU6-pcnNs";
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

// ---------- IndexedDB Helper ----------
// ---------- IndexedDB Helper ----------

async function saveInstrumentToDB(instrument) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // Always check store existence (extra safe)
    if (!db.objectStoreNames.contains("watchlist")) {
      console.error(
        "❌ Object store 'watchlist' not found — need to recreate DB."
      );
      db.close();
      indexedDB.deleteDatabase("UpstoxDB");
      alert("Database reset — please refresh page.");
      reject("Object store missing");
      return;
    }

    const tx = db.transaction("watchlist", "readwrite");
    const store = tx.objectStore("watchlist");
    store.put(instrument);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (event) => reject(event.target.error);
  });
}

async function fetchLatestPrice(instrumentKey, accessToken) {
  const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${instrumentKey}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Price fetch error:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("📈 Latest price:", data);
    return data;
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return null;
  }
}

async function fetchOptionContracts(instrumentKey, accessToken) {
  try {
    const url = `https://api.upstox.com/v2/option/contract?instrument_key=${encodeURIComponent(
      instrumentKey
    )}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    return data?.data || [];
  } catch (e) {
    console.error("❌ Error fetching option contracts:", e);
    return [];
  }
}
