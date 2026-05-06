
const { json, getCurrentUser, safeUser } = require('./_utils');
exports.handler = async (event) => {
  const user = await getCurrentUser(event);
  if (!user) return json(401, { error:'Sessão inválida' });
  return json(200, { user:safeUser(user) });
};
