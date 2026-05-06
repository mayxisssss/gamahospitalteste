
const { db, json, parseBody } = require('./_utils');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error:'Método não permitido' });
  const body = parseBody(event);
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || '';
  const ua = event.headers['user-agent'] || '';
  await db.from('analytics_events').insert({ type:body.type||'event', page:body.page||'', path:body.path||'', referrer:body.referrer||'', device:body.device||'', details:body.details||{}, ip, user_agent:ua });
  return json(200, { ok:true });
};
