import express from 'express';
import api from './api/api';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('build'));

app.listen(port, () => console.log('server started on port ' + port));
app.use('/api', api);
