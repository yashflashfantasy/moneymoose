async function getDhanFunds(access_token) {
  const r = await fetch("https://authority-combine-screensavers-far.trycloudflare.com/dhan-get-funds", {
    method: "GET",
    headers: { "access-token": access_token },
  });
  const json = await r.json();
  return json;
}
