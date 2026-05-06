
const { db, json, parseBody, getCurrentUser, safeUser, canManageUser, makeSalt, hashPassword, logAction, ALL_PERMISSIONS, MAIN_MANAGER } = require('./_utils');
exports.handler = async (event) => {
  const current = await getCurrentUser(event);
  if (!current) return json(401, { error:'Sessão inválida' });
  if (!current.manager) return json(403, { error:'Apenas Gerenciadores podem gerenciar usuários.' });
  if (event.httpMethod === 'GET') {
    const { data, error } = await db.from('admin_users').select('*').order('created_at', { ascending:true });
    if (error) return json(500, { error:error.message });
    return json(200, { users:(data||[]).map(safeUser) });
  }
  const body = parseBody(event);
  if (event.httpMethod === 'POST') {
    if (!canManageUser(current, null)) return json(403, { error:'Sem permissão.' });
    const salt = makeSalt();
    const manager = current.username === MAIN_MANAGER && !!body.manager;
    const row = {
      username:String(body.username||'').trim(), name:body.name||'', salt, password_hash:hashPassword(body.password||'123456', salt),
      manager, protected:false, full_access: manager || !!body.fullAccess, permissions: manager ? ALL_PERMISSIONS : (body.permissions||[]), active: body.active !== false
    };
    const before = (await db.from('admin_users').select('*')).data || [];
    const { data:user, error } = await db.from('admin_users').insert(row).select('*').single();
    if (error) return json(500, { error:error.message });
    const after = (await db.from('admin_users').select('*')).data || [];
    await logAction(current.username, 'Criou usuário', 'users', before.map(safeUser), after.map(safeUser));
    return json(200, { user:safeUser(user) });
  }
  if (event.httpMethod === 'PUT') {
    const { data:target } = await db.from('admin_users').select('*').eq('id', body.id).maybeSingle();
    if (!target) return json(404, { error:'Usuário não encontrado.' });
    if (!canManageUser(current, target)) return json(403, { error:'Você não pode alterar este usuário.' });
    const before = (await db.from('admin_users').select('*')).data || [];
    const patch = { name:body.name||target.name, active: body.active !== false, updated_at:new Date().toISOString() };
    if (target.username !== MAIN_MANAGER) {
      patch.manager = current.username === MAIN_MANAGER ? !!body.manager : target.manager;
      patch.full_access = patch.manager || !!body.fullAccess;
      patch.permissions = patch.manager ? ALL_PERMISSIONS : (body.permissions || []);
    }
    if (body.password) { patch.salt = makeSalt(); patch.password_hash = hashPassword(body.password, patch.salt); }
    const { data:user, error } = await db.from('admin_users').update(patch).eq('id', target.id).select('*').single();
    if (error) return json(500, { error:error.message });
    const after = (await db.from('admin_users').select('*')).data || [];
    await logAction(current.username, 'Editou usuário', 'users', before.map(safeUser), after.map(safeUser));
    return json(200, { user:safeUser(user) });
  }
  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id;
    const { data:target } = await db.from('admin_users').select('*').eq('id', id).maybeSingle();
    if (!target || target.protected) return json(403, { error:'Este usuário não pode ser removido.' });
    if (!canManageUser(current, target)) return json(403, { error:'Você não pode remover este usuário.' });
    const before = (await db.from('admin_users').select('*')).data || [];
    const { error } = await db.from('admin_users').delete().eq('id', id);
    if (error) return json(500, { error:error.message });
    const after = (await db.from('admin_users').select('*')).data || [];
    await logAction(current.username, 'Removeu usuário', 'users', before.map(safeUser), after.map(safeUser));
    return json(200, { ok:true });
  }
  return json(405, { error:'Método não permitido' });
};
