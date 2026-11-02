# todonna.gitlab.io

A simple TODO / Shopping list app without bloat or ads.

![Todonna](https://mobilohm.gitlab.io/img/shots/todonna.png)

This is a [PWA](https://en.wikipedia.org/wiki/Progressive_web_app), simply visit [Todonna](https://todonna.gitlab.io/) with your - both desktop or mobile -  browser and use "Install Todonna" to have it available even when offline.

If you find one of the [MobilOhm](https://mobilohm.gitlab.io/) apps helpful and would like to support its development, consider making a contribution through [Ko-fi](https://ko-fi.com/yphil) or [Liberapay](https://liberapay.com/yPhil/).

Your support helps keep this app free, open source, and ad-free.

## Ponder Source fork

This fork is intended for https://todonna.pondersource.com, deployed by GitLab
Pages from the default branch. With Node.js 22, run `npm ci`, `npm test`, and
`npm run build`. The build publishes only the app and its two locked vendor
bundles into `public/`; checked-in historical `node_modules` files are not used.

The browser suite starts a disposable Armadietto provider on localhost:8111.
It checks fresh-device retrieval and incoming todo updates and deletion,
in addition to local editing and undo. No real storage credentials are needed.

The custom hostname needs an A record to GitLab Pages (`35.185.44.232`) and the
TXT ownership-verification record supplied by the project's Pages settings.
Enable GitLab's automatic Let's Encrypt certificate for HTTPS.
