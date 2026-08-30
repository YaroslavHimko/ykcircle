# Google Maps security and cost controls

The browser key is intentionally visible to visitors. It must therefore be a
dedicated, restricted browser key; it is not a secret and must never be reused
as a backend/server key.

## Google Cloud configuration

1. Create a browser-only key for this website. Under **Application
   restrictions**, choose **Websites** and add only the real origins, for
   example `https://ykcircle.example/*` and (only while developing)
   `http://localhost:4173/*`. Remove development origins before release.
2. Under **API restrictions**, allow only **Maps JavaScript API** and the
   Places API required by the location picker. Do not enable APIs the frontend
   no longer uses, including Maps Embed API if it remains unused.
3. Set a project budget and billing alerts. Set sensible per-API quota limits
   and alerts that notify the team before normal usage is exceeded. Review
   usage by credential regularly.
4. Enable and enforce [Firebase App Check for Maps JavaScript
   API](https://developers.google.com/maps/documentation/javascript/maps-app-check)
   before production traffic. It adds attestation to the Maps requests, making
   abuse from copied website code harder. This needs Firebase configuration and
   an approved attestation provider, so it is a deployment task rather than a
   value that should be hard-coded in this repository.
5. Rotate the browser key if it was ever pasted into an issue, chat, commit,
   screenshot, or an unrestricted environment. Update the backend setting with
   the replacement key.

Google's current key guidance is to use both application and API restrictions,
and to use separate keys for separate applications. See the [Google Maps API
Security Best Practices](https://developers.google.com/maps/api-security-best-practices).

## Backend implementation request

The `/api/maps/config` endpoint should return only the dedicated browser key
and non-sensitive flags such as `enabled` and `requiresConsent`. It must never
return a server key, service-account credential, or unrestricted key.

Apply rate limiting to this endpoint (for example, a small per-IP allowance
with a rolling window) and return cache headers appropriate for a configuration
response. This reduces pointless application traffic, but it does **not**
protect the browser key itself: a browser key is still visible to an authorised
website visitor.

Rate-limit venue and event writes at the backend, after authentication and
authorisation, using both account and IP keys. A practical starting policy is
five creates per account per ten minutes, and thirty updates per account per
ten minutes, with a tighter temporary IP limit to absorb distributed abuse.
Return `429 Too Many Requests` with `Retry-After`, log the account, IP hash,
route, action, and decision, and alert on sustained denials. Apply the same
limits to bulk or draft endpoints that can create equivalent records.

If the backend later calls Geocoding, Places, or Routes APIs, use a *different*
server key restricted by server egress IP address and to only the required APIs.
Require an authenticated user, authorise the action, rate-limit per account and
IP, validate request shapes, and cache normalised results. Never build an
unlimited "proxy any Google Maps URL" endpoint.

Add monitoring and alerts for request spikes and unexpected spend. Google has
additional operational guidance in its [pre-launch
checklist](https://developers.google.com/maps/documentation/javascript/pre-launch-checklist)
and [usage and billing documentation](https://developers.google.com/maps/documentation/javascript/usage-and-billing).

## Frontend controls in this repository

- The configuration request and Google Maps script are singletons for the life
  of the SPA, so navigation cannot inject or download the script repeatedly.
- Each public map creates its Maps JavaScript instance only once when its detail
  page is rendered; rerenders do not inject or download another script.
- Maps do not load until external-media consent is granted when the backend
  requires that consent.
- Places is loaded only after a user presses **Search address on map** in a
  venue or event editor. Displaying an existing event or venue imports only the
  Maps library; it never imports or calls Places.
- Searches are delayed 400 ms, require three characters, discard stale results,
  and use one Places session token from the first query through the selected
  place's details request. The token is discarded immediately after selection.
- The selected record stores the Google place ID, coordinates, and formatted
  address. The frontend does not expose a generic geocoding request function or
  persist the key in storage.

For high Places activity, configure a Google Cloud Monitoring alert for an
unexpected rise in Places Autocomplete/Place Details requests for this browser
key. Backend logs cannot reliably observe direct browser-to-Google calls;
backend audit logs should instead alert on unusually high venue/event create or
edit rates.

These measures reduce accidental usage. Website/API restrictions, quotas,
budget alerts, App Check, and backend controls are the enforcement layer
against deliberate abuse.
