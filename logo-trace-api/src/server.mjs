import http from "node:http";
import { traceLogo } from "./process.mjs";
const PORT=Number(process.env.PORT || 8080);
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN || "http://localhost:3000";
http.createServer(async(req,res)=>{
  const origin=req.headers.origin || "";
  if(origin===ALLOWED_ORIGIN){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");}
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS"){res.writeHead(origin===ALLOWED_ORIGIN?204:403).end();return;}
  if(req.url!=="/trace" || req.method!=="POST"){res.writeHead(404).end();return;}
  if(origin && origin!==ALLOWED_ORIGIN){res.writeHead(403).end();return;}
  let total=0; const chunks=[];
  try{
    for await(const part of req){total+=part.length;if(total>5*1024*1024)throw new Error("Archivo demasiado grande");chunks.push(part);}
    const result=await traceLogo(Buffer.concat(chunks));
    res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify(result));
  }catch(err){res.writeHead(422,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(JSON.stringify({error:err instanceof Error?err.message:"No se pudo procesar"}));}
}).listen(PORT);
