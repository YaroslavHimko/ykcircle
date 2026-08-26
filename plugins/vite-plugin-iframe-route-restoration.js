export default function iframeRouteRestorationPlugin() {
	return {
		name: 'vite:iframe-route-restoration',
		apply: 'serve',
		transformIndexHtml() {
			const script = `
			const ALLOWED_PARENT_ORIGINS = [
          "https://horizons.hostinger.com",
          "https://horizons.hostinger.dev",
          "https://horizons-frontend-local.hostinger.dev",
      ];

      // Check to see if the page is in an iframe
      if (window.self !== window.top) {
			const STORAGE_KEY = 'horizons-iframe-saved-route';

			const getCurrentRoute = () => location.pathname + location.search + location.hash;

			const save = () => {
				try {
					const currentRoute = getCurrentRoute();
					sessionStorage.setItem(STORAGE_KEY, currentRoute);
					window.parent.postMessage({message: 'route-changed', route: currentRoute}, '*');
				} catch {}
			};

			let pendingRoute = null;

			const requestRouterNavigation = (route) => {
				if (typeof route !== 'string' || !route.startsWith('/')) return;

				pendingRoute = route;
				window.dispatchEvent(new CustomEvent('horizons:router-navigate', {
					detail: { route }
				}));
			};

			// The React app dispatches this after its router has mounted. This keeps
			// route restoration from changing browser history behind React Router's
			// back, which previously left the router and address bar out of sync.
			window.addEventListener('horizons:router-ready', () => {
				if (pendingRoute) requestRouterNavigation(pendingRoute);
			});

			const restore = () => {
				try {
					const saved = sessionStorage.getItem(STORAGE_KEY);
					if (!saved) return;

					if (!saved.startsWith('/')) {
						sessionStorage.removeItem(STORAGE_KEY);
						return;
					}

					const current = getCurrentRoute();
					if (current !== saved) {
						requestRouterNavigation(saved);
					}
				} catch {}
			};

			const originalPushState = history.pushState;
			history.pushState = function(...args) {
				originalPushState.apply(this, args);
				save();
			};

			const originalReplaceState = history.replaceState;
			history.replaceState = function(...args) {
				originalReplaceState.apply(this, args);
				save();
			};

      const getParentOrigin = () => {
          if (
              window.location.ancestorOrigins &&
              window.location.ancestorOrigins.length > 0
          ) {
              return window.location.ancestorOrigins[0];
          }

          if (document.referrer) {
              try {
                  return new URL(document.referrer).origin;
              } catch (e) {
                  console.warn("Invalid referrer URL:", document.referrer);
              }
          }

          return null;
      };

			window.addEventListener('popstate', save);
			window.addEventListener('hashchange', save);
			window.addEventListener("message", function (event) {
				const parentOrigin = getParentOrigin();
				if (!parentOrigin || !ALLOWED_PARENT_ORIGINS.includes(parentOrigin)) return;

				if (event.data?.type === "redirect-home") {
					const saved = sessionStorage.getItem(STORAGE_KEY);
					if (saved && saved !== '/') {
						requestRouterNavigation('/');
					}
				}

				if (event.data?.type === "navigate-to-route" && typeof event.data.path === "string") {
					const target = event.data.path.startsWith('/') ? event.data.path : '/' + event.data.path;
					const current = getCurrentRoute();
					if (current !== target) {
						requestRouterNavigation(target);
					}
				}
			});


			restore();
        }
      `;

			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: script,
					injectTo: 'head'
				}
			];
		}
	};
}
