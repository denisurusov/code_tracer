// Browser side of the FX Quote page. Uses textContent only (no HTML injection).
const form = document.getElementById("quote-form");
const pairSelect = document.getElementById("pair");
const result = document.getElementById("result");
const error = document.getElementById("error");

async function loadPairs() {
  const res = await fetch("/api/pairs");
  for (const pair of await res.json()) {
    const opt = document.createElement("option");
    opt.value = pair;
    opt.textContent = `${pair.slice(0, 3)}/${pair.slice(3)}`;
    pairSelect.append(opt);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  const data = new FormData(form);
  const params = new URLSearchParams({
    pair: data.get("pair"),
    amount: data.get("amount"),
    side: data.get("side"),
  });
  const res = await fetch(`/api/quote?${params}`);
  const body = await res.json();
  if (!res.ok) {
    result.textContent = "No quote.";
    error.textContent = `Could not get a quote: ${body.error}`;
    return;
  }
  const quoteCcy = body.pair.slice(3);
  result.textContent =
    `${body.side === "buy" ? "Buy" : "Sell"} ${body.amount.toLocaleString("en-US")} ${body.pair.slice(0, 3)} ` +
    `at ${body.price} = ${body.converted.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${quoteCcy}`;
});

loadPairs();
