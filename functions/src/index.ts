import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

initializeApp();
const db=getFirestore();
const app=express();
app.use(helmet());
app.use(cors({origin:true,credentials:false}));
app.use(express.json({limit:'32kb'}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:100*1024*1024,files:1}});

async function requireAdmin(req:express.Request,res:express.Response,next:express.NextFunction){
 try{
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
  const decoded=await getAuth().verifyIdToken(header.slice(7),true);
  const admin=await db.doc(`admins/${decoded.uid}`).get();
  if(!admin.exists||admin.data()?.active!==true) return res.status(403).json({error:'Admin access denied'});
  (req as any).uid=decoded.uid; next();
 }catch{return res.status(401).json({error:'Invalid or expired session'});}
}
app.get('/health',(_req,res)=>res.json({ok:true,service:'social-ai-api'}));
app.use(requireAdmin);
app.get('/me',(req,res)=>res.json({ok:true,uid:(req as any).uid}));
app.post('/jobs',upload.single('video'),async(req,res)=>{
 try{
  if(!req.file)return res.status(400).json({error:'Video file is required'});
  const platforms=JSON.parse(String(req.body.platforms||'[]'));
  if(!Array.isArray(platforms)||platforms.some((p:string)=>!['instagram','youtube'].includes(p))||platforms.length===0)return res.status(400).json({error:'Choose Instagram and/or YouTube'});
  // Do not persist media bytes or claim publishing here. Production media storage and provider OAuth must be configured.
  const ref=await db.collection('jobs').add({ownerUid:(req as any).uid,status:'awaiting_provider_setup',platforms,caption:String(req.body.caption||'').slice(0,5000),fileName:req.file.originalname.slice(0,180),fileSize:req.file.size,mimeType:req.file.mimetype,createdAt:FieldValue.serverTimestamp(),message:'Provider OAuth and secure media storage are not configured. No post has been published.'});
  return res.status(202).json({jobId:ref.id,status:'awaiting_provider_setup',message:'Job record created only. No social post has been published.'});
 }catch{return res.status(400).json({error:'Invalid publishing job'});}
});
app.get('/jobs',async(req,res)=>{
 const snap=await db.collection('jobs').where('ownerUid','==',(req as any).uid).orderBy('createdAt','desc').limit(50).get();
 res.json({jobs:snap.docs.map(d=>({id:d.id,...d.data()}))});
});
app.use((_req,res)=>res.status(404).json({error:'Not found'}));
export const api=onRequest({region:'asia-south1',maxInstances:3,timeoutSeconds:60,memory:'512MiB'},app);
