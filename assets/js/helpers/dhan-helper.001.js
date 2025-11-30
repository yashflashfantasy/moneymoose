async function getDhanFunds(access_token) {
  const r = await fetch("https://textiles-grey-knowing-collapse.trycloudflare.com/dhan-get-funds", {
    method: "GET",
    headers: { "access-token": access_token },
  });
  const json = await r.json();
  return json;
}
