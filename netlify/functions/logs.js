
const { db, json, parseBody, getCurrentUser, can, logAction } = require('./_utils');
exports.handler = async (event) => {
  const user = await getCurrentUser(event);
  if (!user) return json(401, { error:'Sessão inválida' });
  if (!can(user, 'logs')) return json(403, { error:'Sem permissão.' });
  if (event.httpMethod === 'GET') {
    const { data, error } = await db.from('admin_logs').select('*').order('created_at', { ascending:false }).limit(200);
    if (error) return json(500, { error:error.message });
    return json(200, { logs:data||[] });
  }
  if (event.httpMethod === 'POST') {
    const body = parseBody(event);
    if (body.action === 'undo') {
      const { data:log } = await db.from('admin_logs').select('*').eq('id', body.id).maybeSingle();
      if (!log || !log.before_data) return json(400, { error:'Não há dados para desfazer.' });
      if (log.area === 'users' && Array.isArray(log.before_data)) {
        return json(400, { error:'Logs de usuário não são desfeitos automaticamente nesta versão por segurança.' });
      }
      await db.from('cms_data').upsert({ id:'main', data:log.before_data, updated_at:new Date().toISOString() });
      await logAction(user.username, `Desfez: ${log.action}`, 'logs', log.after_data || null, log.before_data);
      return json(200, { ok:true });
    }
  }
  if (event.httpMethod === 'DELETE') {
    await db.from('admin_logs').delete().neq('id','00000000-0000-0000-0000-000000000000');
    return json(200, { ok:true });
  }
  return json(405, { error:'Método não permitido' });
};
