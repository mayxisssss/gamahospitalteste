
const { db, json, parseBody, getCurrentUser, can, logAction } = require('./_utils');
exports.handler = async (event) => {
  const user = await getCurrentUser(event);
  if (!user) return json(401, { error:'Sessão inválida' });
  if (event.httpMethod === 'GET') {
    const { data, error } = await db.from('cms_data').select('data').eq('id','main').maybeSingle();
    if (error) return json(500, { error:error.message });
    return json(200, { data: data?.data || {} });
  }
  if (event.httpMethod === 'PUT') {
    if (!can(user, 'site')) return json(403, { error:'Sem permissão para salvar conteúdo.' });
    const body = parseBody(event);
    const before = await db.from('cms_data').select('data').eq('id','main').maybeSingle();
    const next = body.data || {};
    const { error } = await db.from('cms_data').upsert({ id:'main', data:next, updated_at:new Date().toISOString() });
    if (error) return json(500, { error:error.message });
    await logAction(user.username, body.action || 'Alterou conteúdo', body.area || 'data', before.data?.data || null, next);
    return json(200, { ok:true, data:next });
  }
  if (event.httpMethod === 'POST') {
    const body = parseBody(event);
    if (body.action === 'reset-total') {
      if (!can(user, 'reset')) return json(403, { error:'Sem permissão.' });
      const before = await db.from('cms_data').select('data').eq('id','main').maybeSingle();
      const empty = body.emptyData || {};
      const { error } = await db.from('cms_data').upsert({ id:'main', data:empty, updated_at:new Date().toISOString() });
      if (error) return json(500, { error:error.message });
      await logAction(user.username, 'Resetou tudo literalmente', 'reset', before.data?.data || null, empty);
      return json(200, { ok:true, data:empty });
    }
    return json(400, { error:'Ação inválida' });
  }
  return json(405, { error:'Método não permitido' });
};
