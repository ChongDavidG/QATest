export const testData = {
  searchTerm: process.env.SEARCH_TERM ?? 'playstation 5',
  color: process.env.PRODUCT_COLOR ?? 'White',
  productLimit: Number(process.env.MAX_PRODUCTS ?? 5),
  minimumNetworkMatches: Number(process.env.MIN_NETWORK_MATCHES ?? 3),
  maxResultsLoadMs: Number(process.env.MAX_RESULTS_LOAD_MS ?? 15_000)
};
