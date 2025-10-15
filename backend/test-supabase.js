require('dotenv').config();

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);

try {
  const { supabase } = require('./src/config/supabase');
  console.log('Supabase client created successfully');
  
  // Test simple query
  supabase
    .from('users')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase query error:', error);
      } else {
        console.log('Supabase connection test successful');
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('Supabase connection failed:', err);
      process.exit(1);
    });
    
} catch (error) {
  console.error('Error creating Supabase client:', error);
  process.exit(1);
}
