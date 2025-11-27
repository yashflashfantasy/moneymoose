async function getDhanFunds(access_token) {
  const r = await fetch("http://localhost:3000/dhan-get-funds", {
    method: "GET",
    headers: { "access-token": access_token },
  });
  const json = await r.json();
  return json;
}
