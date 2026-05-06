
const { json, ensureMainManager, db } = require('./_utils');
exports.handler = async () => {
  try {
    const user = await ensureMainManager();
    return json(200, { ok:true, message:'MayconAdmin pronto.', user:{ username:user.username, manager:user.manager } });
  } catch(error){ return json(500, { ok:false, error:error.message }); }
};
