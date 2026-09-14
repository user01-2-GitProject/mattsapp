export default {
  async fetch(request: Request, env: { ASSETS: { fetch: typeof fetch } }): Promise<Response> {
    return env.ASSETS.fetch(request);
  }
};
