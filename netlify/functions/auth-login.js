
const { db, json, parseBody, hashPassword, sign, safeUser, ensureMainManager, logAction } = require('./_utils');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error:'Método não permitido' });
  try {
    await ensureMainManager();
    const { usuario, senha } = parseBody(event);
    const { data:user, error } = await db.from('admin_users').select('*').eq('username', String(usuario||'').trim()).maybeSingle();
    if (error || !user || !user.active) return json(401, { error:'Usuário ou senha incorretos.' });
    const attempt = hashPassword(String(senha||''), user.salt);
    if (attempt !== user.password_hash) return json(401, { error:'Usuário ou senha incorretos.' });
    const token = sign({ id:user.id });
    await logAction(user.username, 'Entrou no painel', 'auth');
    return json(200, { ok:true, token, user:safeUser(user) });
  } catch(error){ return json(500, { error:error.message }); }
};
