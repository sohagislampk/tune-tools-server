const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;


const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Tune Tools Server Is Running');
})

app.listen(port, (req, res) => {
    console.log('Server is running on port :', port);
})