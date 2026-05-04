export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Pages Functions 工作正常！',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
