import { createServer, type Server } from "node:http";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: system-ui; padding: 40px; }
  .fixture { min-height: 120px; margin-bottom: 24px; }
  #moving { width: 140px; height: 44px; }
  #state-panel { width: 220px; height: 70px; opacity: 0; background: #ddd; }
  #exited { width: 180px; height: 44px; }
  #reduced { width: 100px; height: 44px; background: #ddd; }
</style>
</head>
<body>
  <section class="fixture">
    <button id="moving">Moving target</button>
  </section>
  <section class="fixture">
    <button id="state-trigger">Toggle panel</button>
    <div id="state-panel" data-state="closed">State panel</div>
  </section>
  <section class="fixture">
    <button id="exited">Exited target</button>
  </section>
  <section class="fixture">
    <div id="reduced">Reduced motion</div>
  </section>
<script>
  const moving = document.querySelector('#moving');
  moving.addEventListener('pointerdown', () => {
    setTimeout(() => { moving.style.transform = 'translateX(40px)'; }, 12);
  });

  const stateTrigger = document.querySelector('#state-trigger');
  const statePanel = document.querySelector('#state-panel');
  stateTrigger.addEventListener('click', () => {
    if (statePanel.dataset.state === 'closed') {
      statePanel.dataset.state = 'open';
      statePanel.style.opacity = '1';
    } else {
      statePanel.dataset.state = 'closed';
      // Deliberate bug: visual state stays open after the rapid reversal.
      statePanel.style.opacity = '1';
    }
  });
</script>
</body>
</html>`;

export async function startFixtureServer(): Promise<Readonly<{ server: Server; origin: string }>> {
  const server = createServer((request, response) => {
    if (request.url === "/service-worker.js") {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end("self.addEventListener('fetch', () => undefined);");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("Fixture server failed.");
  return Object.freeze({ server, origin: `http://127.0.0.1:${String(address.port)}` });
}

export async function closeFixtureServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
}
