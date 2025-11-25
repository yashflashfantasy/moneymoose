// List of linked clients
const linked_clients = [
  {
    id: 1,
    client_name: "Anupriya",
    trading_limit: "5000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiIzWUFSRVAiLCJqdGkiOiI2OTI1MDBiMzZkYjJkOTA0MTNhNjFhNDQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyNjkxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.Gj-mrjHCBCG5jQJdGtiaOtp72-jrA09JpCvOSKmdEBc",
  },
  {
    id: 2,
    client_name: "Muni Venkatesham",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNCM0EiLCJqdGkiOiI2OTI1MDBlODZkYjJkOTA0MTNhNjFhNDUiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyNzQ0LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.fzFZdHUeR4YVRdxO39Hvx2in7ekUrydJqRB0lmYGnTc",
  },
  {
    id: 3,
    client_name: "Muni Venkatesham 2",
    trading_limit: "8000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNHNzgiLCJqdGkiOiI2OTI1MDExNTRhMWI4NjZiMjhkNmY2OGQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyNzg5LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.bPLSHw8o0dB3iT5bEPz5o_kHc7ZGO2AbJVk7f0x7q2A",
  },
  {
    id: 4,
    client_name: "M Ganesh Kumar",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNERVoiLCJqdGkiOiI2OTI1MDE0YTZkYjJkOTA0MTNhNjFhNDkiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyODQyLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.EvsU56gGu-NUtk0NeSr7hxVKoDgReoefCWq5SaEU5Do",
  },
  {
    id: 5,
    client_name: "Payyavula Sudhir",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNFVDQiLCJqdGkiOiI2OTI1MDE3NTRhMWI4NjZiMjhkNmY2OTAiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyODg1LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.e1krhZ4qhxg1LPBSMMoWJiEtBHdujr7FHQfLG45nag4",
  },
  {
    id: 6,
    client_name: "Aaditya Maheshwari",
    trading_limit: "10000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNRTjYiLCJqdGkiOiI2OTI1MDFhMTZkYjJkOTA0MTNhNjFhNGQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyOTI5LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.Uh4IazCtm5puy6vZSH07fmSRCKDhmJj7n3OwIUTSJEA",
  },
  {
    id: 7,
    client_name: "Avinash Reddy",
    trading_limit: "5000",
    active: true,
    platform:'upstox',
    access_token:
      "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI0TkNWRVEiLCJqdGkiOiI2OTI1MDFkNTRhMWI4NjZiMjhkNmY2OTQiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6dHJ1ZSwiaWF0IjoxNzY0MDMyOTgxLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3NjQxMDgwMDB9.9vrxCu3OThrkaHacMe-KEofG8E6hgnpbBhe5fADmOwc",
  },
  {
    id: 8,
    client_name: "Kotrappa Gangadhar",
    trading_limit: "8000",
    client_id: "1107441964",
    active: false,
    platform:'dhan',
    access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzY0MTE5NDgxLCJpYXQiOjE3NjQwMzMwODEsInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTA3NDQxOTY0In0.484FyoY9qGDEq-oHtYe1F3FjHMfsD9pdnm5fmi1TP1i9rdIagQ5XCCa_uB8xbxIJdGFKPz8ea-6lVptORjzaog"
  }
];