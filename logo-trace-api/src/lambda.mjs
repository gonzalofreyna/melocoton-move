import { traceLogo } from "./process.mjs";
const allowedOrigin=process.env.ALLOWED_ORIGIN || "https://www.melocotonmove.com";
export async function handler(event) {
  const origin=event.headers?.origin || event.headers?.Origin || "";
  const headers={"Content-Type":"application/json","Cache-Control":"no-store",...(origin===allowedOrigin?{"Access-Control-Allow-Origin":origin,"Vary":"Origin"}:{})};
  if(event.requestContext?.http?.method==="OPTIONS")return {statusCode:origin===allowedOrigin?204:403,headers,body:""};
  if(origin!==allowedOrigin || event.requestContext?.http?.method!=="POST" || event.rawPath!=="/trace")return {statusCode:403,headers,body:""};
  try{
    const bytes=Buffer.from(event.body||"",event.isBase64Encoded?"base64":"utf8");
    return {statusCode:200,headers,body:JSON.stringify(await traceLogo(bytes))};
  }catch(e){return {statusCode:422,headers,body:JSON.stringify({error:e instanceof Error?e.message:"No se pudo procesar"})};}
}
