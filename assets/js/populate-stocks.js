const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

populateTable();

function formatPrice(value) {
  if (isNaN(value)) return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function populateTable() {
  let instrumentsTable = await getAllSavedInstruments();

  const tbody = document.getElementById("marketTableBody");

  tbody.innerHTML = "";

  instrumentsTable.forEach((stock) => {
    if (!stock.details || typeof stock.details !== "object") {
      return;
    }

    const detailKeys = Object.keys(stock.details);
    if (detailKeys.length === 0) {
      return;
    }

    const detailsKey = detailKeys[0];
    const details = stock.details[detailsKey];

    const [segment] = (detailsKey || "").split(":");

    const ohlc = details?.ohlc;
    const lastPrice = details?.last_price ?? "-";

    const row = document.createElement("tr");
    row.innerHTML = `
          <td><input type="checkbox"></td>
          <td>${stock.trading_symbol}</td>
          <td>${stock.lot_size}</td>
          <td>${stock.instrument_key}</td>
          <td class="latest-price">${formatPrice(lastPrice)}</td>
          <td class="bought-at">${formatPrice(stock.bought_at)}</td>
          <td class="sold-at">${formatPrice(stock.exit_at)}</td>
          <td class="profit-loss">${formatPrice(stock.bought_at-stock.exit_at)}</td>
          <td class="actions">
                <button class="btn btn-sm btn-success" data-action="buy">Buy</button>
                <button class="btn btn-sm btn-warning" data-action="exit">Exit</button>
                <button class="btn btn-sm btn-info" data-action="refresh">Refresh</button>
                <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
          </td>

        `;
    tbody.appendChild(row);
  });

  document.getElementById("select-all").addEventListener("change", function () {
    document
      .querySelectorAll('#marketTableBody input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = this.checked;
      });
  });
}
