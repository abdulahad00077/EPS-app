const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim().replace(/^\"|\"$/g, '');
  return acc;
}, {});

fetch(env.EXPO_PUBLIC_SUPABASE_URL + '/rest/v1/exam_results?limit=1', {
  headers: {
    'apikey': env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  }
})
.then(r => r.json())
.then(data => console.log('Results:', data))
.catch(e => console.error(e));
