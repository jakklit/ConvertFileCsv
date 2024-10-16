const express = require('express');
const router = require('./api/convert');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// const corsOptions = {
//     origin: ['https://webconvertcsv.onrender.com', 'http://localhost:3000/api/upload'],
// };

app.use(cors());

app.use('/api', router);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
