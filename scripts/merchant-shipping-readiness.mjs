#!/usr/bin/env node
// Auditoría de configuración de Merchant Center sin alterar tienda ni datos.
// Uso: node scripts/merchant-shipping-readiness.mjs
import nextEnv from "@next/env";
const {loadEnvConfig}=nextEnv;
loadEnvConfig(process.cwd());
const api=process.env.NEXT_PUBLIC_API_PRODUCTS_URL;
if(!api) throw new Error("Falta NEXT_PUBLIC_API_PRODUCTS_URL");
const response=await fetch(api,{cache:"no-store"});
if(!response.ok) throw new Error(`API HTTP ${response.status}`);
const products=await response.json();
if(!Array.isArray(products)) throw new Error("La API no devolvió productos");
const groups=new Map(), problems=[];
let eligible=0, preorder=0, custom=0;
for(const p of products){
  if(p.shippingType==="custom" || /reformer/i.test([p.name,p.slug,p.category].join(" "))) custom++;
  if(!Number.isInteger(p.stock)||p.stock<0){problems.push(`${p.sku||p.slug}: stock sin validar`);continue;}
  const e=p.shippingEstimate;
  const min=e?.minBusinessDays,max=e?.maxBusinessDays;
  if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max<min){problems.push(`${p.sku||p.slug}: plazo inválido`);continue;}
  eligible++;
  if(min>=45)preorder++;
  const label=`entrega-${min}-${max}-habiles`;
  const group=groups.get(label)||{label,products:0,missingWeight:0,missingDimensions:0,samples:[]};
  group.products++;
  if(!(Number(p.weightGrams)>0))group.missingWeight++;
  if(!p.dimensionsCm||!["w","h","l"].every(k=>Number(p.dimensionsCm[k])>0))group.missingDimensions++;
  if(group.samples.length<4)group.samples.push(p.sku||p.slug);
  groups.set(label,group);
}
console.log("Catálogo API:",products.length,"Elegibles:",eligible,"Con logística especial incluidos (cuando sus datos sean válidos):",custom,"Bajo pedido elegibles:",preorder);
console.table([...groups.values()].sort((a,b)=>a.label.localeCompare(b.label)).map(g=>({
  "Etiqueta Merchant":g.label,"Productos":g.products,"Sin peso":g.missingWeight,
  "Sin dimensiones":g.missingDimensions,"Ejemplos":g.samples.join(", ")
})));
if(problems.length){console.error("Problemas:",problems);process.exitCode=1;}
console.log("Merchant Center: tarifa gratuita universal. Verificar plazos de entrega por grupo, especialmente reformers y bajo pedido.");
console.log("La bandera freeShipping del catálogo ya no condiciona el costo al cliente.");
