export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: { waitUntil: (promise: Promise<unknown>) => void }): Promise<Response> {
    return new Response("Not Found", { status: 404 });
  }
};
