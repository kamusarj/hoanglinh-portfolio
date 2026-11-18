# Share Text

The portfolio's **Share Text** tab opens `/share/`. It works with the existing
static Vercel deployment: there is no build step, database, API route or secret
to configure.

## Using a room

1. Open `/share/` on the first device and choose **Tạo phòng mới**.
2. Copy the room code or link to another device. Open the link and choose
   **Vào phòng**, or enter the code manually.
3. Paste text and choose **Gửi text** (Ctrl/Cmd + Enter). Each message has a
   **Sao chép** button. Incoming text does not replace a draft.

Keep the room creator's page open. Up to six devices can connect. The creator
holds the most recent twenty messages in memory and sends them to new arrivals.
Each message accepts up to 20,000 UTF-16 code units, matching a textarea's
`maxlength`. Reloading or closing the creator's page ends the room; **Đóng
phòng** / **Rời phòng** clears that page's room history. Text is never persisted
in localStorage, a database or the URL. Only the color theme is stored locally.

Room codes are twelve cryptographically random base-32 characters (60 bits).
Anyone with the code or link can enter the room. Invitation codes use a URL
fragment, and the sharing page disables referrers.

## Connection service and limitations

The pinned, locally served [PeerJS 1.5.5](https://github.com/peers/peerjs/tree/v1.5.5)
client uses the public PeerJS Cloud for signaling. Text travels over encrypted
WebRTC data channels. The cloud service must be reachable when creating or
joining a room. No PeerJS account is required.

This default configuration has no authenticated TURN relay. Some corporate
networks, VPNs and combinations of restrictive NATs cannot establish a direct
connection. The page reports timeouts and offers reconnection; switching networks
may help. Consistent support for these networks would require a TURN provider
and a service issuing short-lived relay credentials. See the
[PeerJS FAQ](https://peerjs.com/client/faq).

## Development

Serve the repository root, then open `http://localhost:8000/share/`:

```sh
python3 -m http.server 8000
node --test tests/*.test.mjs
```

Production requires HTTPS. Localhost is accepted for development. Testing on
another device over a plain HTTP LAN address does not provide a secure browser
context; use the HTTPS Vercel URL instead.

The protocol and transport are in `js/text-room.mjs`; `js/share.js` handles the
page. PeerJS is vendored under `js/vendor/` with its MIT license. No package
installation is required to deploy the site.
