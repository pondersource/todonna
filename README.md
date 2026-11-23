# todonna.gitlab.io

A simple TODO / Shopping list app without bloat or ads.

![Todonna](https://mobilohm.gitlab.io/img/shots/todonna.png)

This is a [PWA](https://en.wikipedia.org/wiki/Progressive_web_app), simply visit [Todonna](https://todonna.gitlab.io/) with your - both desktop or mobile -  browser and use "Install Todonna" to have it available even when offline.

If you find one of the [MobilOhm](https://mobilohm.gitlab.io/) apps helpful and would like to support its development, consider making a contribution through [Ko-fi](https://ko-fi.com/yphil) or [Liberapay](https://liberapay.com/yPhil/).

Your support helps keep this app free, open source, and ad-free.

## Ponder Source fork

Upstream source: [todonna/todonna.gitlab.io](https://gitlab.com/todonna/todonna.gitlab.io).
The [GitHub fork](https://github.com/pondersource/todonna) preserves the
[existing Ponder Source GitLab fork](https://gitlab.com/pondersource/todonna.gitlab.io)
history. New changes are reviewed and tested on GitHub.

With Node.js 22, run `npm ci`, `npm test`, and `npm run build`. The build
publishes only the app, locked storage bundles, their source maps and license
notices into `public/`; checked-in historical `node_modules` files are not used.

The GitHub Actions workflow tests the app before uploading `public/` and
deploying it to GitHub Pages from `main`. Enable Pages with **GitHub Actions**
as its source in the repository's **Settings → Pages** before the first
deployment. The initial Pages URL is https://pondersource.github.io/todonna/;
relative asset, manifest and service-worker paths support this project path.
The same browser suite then checks the published app and its storage callback.

The intended custom URL is https://todonna.pondersource.com. Its current DNS
points to the existing GitLab deployment (`35.185.44.232`). After the GitHub
Pages URL is verified, a domain administrator can configure this custom domain
in GitHub Pages, replace the Cloudflare DNS entry with a CNAME to
`pondersource.github.io`, and enable HTTPS. The workflow deliberately publishes
without a CNAME until that routing is ready. The GitLab fork and its upstream
attribution remain available.

The browser suite starts a disposable Armadietto provider on localhost:8111.
It checks fresh-device retrieval and incoming todo updates and deletion,
in addition to local editing and undo. No real storage credentials are needed.

To run the same tests against a published URL or project path, set
`TODONNA_URL=https://pondersource.github.io/todonna/` when running `npm test`.


## PonderSource storage providers

Public OAuth application identifiers are configured in `js/storage-providers.js`. These are
client IDs/app keys, never client secrets. The shared PonderSource Dropbox
registration uses an app folder so these apps can share their remoteStorage data.
Google Drive can sync private data, but rs.js does not support public sharing URLs for that backend.

Register the exact app origin (without a trailing slash) as the OAuth callback.
Hyperdraft uses `https://hyperdraft.pondersource.com/write/` instead. Apps with
nested routes return to their registered callback before starting provider sign-in.

The PonderSource Google OAuth project is `pondersource-apps`. It is in
production mode, available beyond named test users. Google verification is still
pending; users may see an unverified-app warning and the project has a lifetime
100-user cap until its requested scopes are approved. The published privacy
notice is https://pondersource.com/privacy.html.
The Dropbox app is **PonderSource Apps** (app key `gaezgoax9khjilj`), with
additional users enabled in development mode (up to 500 users).
