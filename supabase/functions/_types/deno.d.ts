// Minimal Deno typings so `tsc -b` can check the Edge Functions from Node (Deno itself is not
// installed in this project). Only the APIs the functions use are declared.
declare namespace Deno {
  const env: { get(name: string): string | undefined };
  function serve(handler: (req: Request) => Response | Promise<Response>): unknown;
}
