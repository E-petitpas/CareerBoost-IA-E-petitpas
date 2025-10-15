const express = require('express');
const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server running' });
});

app.get('/api/candidate/profile', (req, res) => {
  res.json({ 
    profile: {
      user_id: 'test',
      title: 'Test Profile',
      summary: 'Test summary',
      experience_years: 5,
      mobility_km: 25,
      preferred_contracts: [],
      users: {
        id: 'test',
        name: 'Test User',
        email: 'test@example.com'
      },
      candidate_skills: [],
      experiences: [],
      educations: []
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});
