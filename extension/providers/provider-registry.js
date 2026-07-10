(function (root) {
  const app = root.OAuthConsentDiff || {};
  const registered = [];
  function register(provider) {
    if (!provider || !provider.id) return;
    const index = registered.findIndex((item) => item.id === provider.id);
    if (index >= 0) registered.splice(index, 1, provider);
    else registered.push(provider);
  }
  function scoreProvider(provider, context) {
    try {
      return provider.detect ? Number(provider.detect(context) || 0) : 0;
    } catch (error) {
      return 0;
    }
  }
  function find(context) {
    return registered
      .map((provider) => ({ provider, score: scoreProvider(provider, context) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.provider || null;
  }
  function get(id) {
    return registered.find((provider) => provider.id === id) || null;
  }
  app.providers = {
    register,
    find,
    get,
    all: () => registered.slice()
  };
  root.OAuthConsentDiff = app;
})(typeof globalThis !== "undefined" ? globalThis : window);
