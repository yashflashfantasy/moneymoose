async function getDhanFunds(access_token) {
  const r = await fetch("https://driver-jose-grade-naturals.trycloudflare.com/dhan-get-funds", {
    method: "GET",
    headers: { "access-token": access_token },
  });
  const json = await r.json();
  return json;
}
