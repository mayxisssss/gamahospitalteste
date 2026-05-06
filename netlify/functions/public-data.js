
const { db, json } = require('./_utils');
exports.handler = async () => {
  const { data, error } = await db.from('cms_data').select('data, updated_at').eq('id','main').maybeSingle();
  if (error) return json(500, { error:error.message });
  return json(200, { data: data?.data || null, updatedAt: data?.updated_at || null });
};
