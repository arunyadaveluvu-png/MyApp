const fs = require('fs');
const ACCESS_TOKEN = 'sbp_58fe2180a16802aa6f8570b681df012ba63b7209';
const PROJECT_ID = 'rtbcnjqxyaqcutyburnh';

async function run() {
  const query = fs.readFileSync('tmp/extend_schema.sql', 'utf8');
  console.log('Applying migration from tmp/extend_schema.sql...');
  
  const url = 'https://api.supabase.com/v1/projects/' + PROJECT_ID + '/query';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const result = await response.json();
  if (response.ok) {
    console.log('Migration applied successfully!');
  } else {
    console.error('Migration failed:', result);
    process.exit(1);
  }
}

run();
