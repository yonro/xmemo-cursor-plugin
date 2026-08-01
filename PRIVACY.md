# Privacy

The XMemo Cursor plugin connects Cursor to the user-selected XMemo account through `https://xmemo.dev/mcp`.

## Plugin-local data

The checkpoint Hook stores only bounded operational metadata under `.cursor/hooks/state/`: counters, timestamps, the last generation identifier, and transcript modification time. It does not read or store transcript content.

## XMemo data

Data is sent to XMemo only through user-authorized MCP operations or an agent action governed by the installed Rule and Skills. Saved content remains subject to XMemo's [Privacy Policy](https://xmemo.dev/legal/privacy) and [Terms of Service](https://xmemo.dev/legal/tos).

Do not save secrets, credentials, private keys, raw transcripts, hidden reasoning, or unverified claims. Users can inspect, update, soft-delete, restore eligible memories, and explicitly request permanent deletion through the available XMemo tools.

Questions: [support@xmemo.dev](mailto:support@xmemo.dev)
