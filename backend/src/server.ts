import 'dotenv/config';
import express from 'express';
import cors from 'cors';
const app=express();
app.use(cors()); app.use(express.json());
app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'gestao-adegas-api',stage:'01-foundation'}));
const port=Number(process.env.PORT||3001);
app.listen(port,'0.0.0.0',()=>console.log(`API listening on ${port}`));
