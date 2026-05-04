export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Functions 工作正常！',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
