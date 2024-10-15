const express = require('express');
const router = require('./convert.js');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

const corsOptions = {
    origin: 'https://webconvertcsv.onrender.com',
};

app.use(cors(corsOptions));

app.use('/api', router);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
