import { getPostalCodeData } from "./postal-code.mjs";

// Zona Metropolitana del Valle de México: CDMX, municipios conurbados del
// Estado de México e Hidalgo (Tizayuca). Nunca clasificar por rango de CP.
const METRO_MUNICIPALITIES = new Set(`
Acolman|Amecameca|Apaxco|Atenco|Atizapan de Zaragoza|Atlautla|Axapusco|Ayapango|Coacalco de Berriozabal|Cocotitlan|Coyotepec|Cuautitlan|Cuautitlan Izcalli|Chalco|Chiautla|Chicoloapan|Chiconcuac|Chimalhuacan|Ecatepec de Morelos|Ecatzingo|Huehuetoca|Hueypoxtla|Huixquilucan|Isidro Fabela|Ixtapaluca|Jaltenco|Jilotzingo|Juchitepec|La Paz|Melchor Ocampo|Naucalpan de Juarez|Nextlalpan|Nezahualcoyotl|Nopaltepec|Otumba|Ozumba|Papalotla|San Martin de las Piramides|Tecamac|Temamatla|Temascalapa|Tenango del Aire|Teoloyucan|Teotihuacan|Tepetlaoxtoc|Tepotzotlan|Tequixquiac|Texcoco|Tezoyuca|Tlalmanalco|Tlalnepantla de Baz|Tonanitla|Tultepec|Tultitlan|Valle de Chalco Solidaridad|Villa del Carbon|Zumpango`.trim().split("|").map(normalize));
function normalize(value) {
 return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
export async function qualifiesForMetroShipping(postalCode) {
 const data = await getPostalCodeData(postalCode);
 if (!data) return false;
 const state=normalize(data.areaLevel1);
 if (["ciudad de mexico","cdmx","distrito federal"].includes(state)) return true;
 const municipio=normalize(data.areaLevel2);
 if (["estado de mexico","mexico","edo de mexico"].includes(state)) return METRO_MUNICIPALITIES.has(municipio);
 return state==="hidalgo" && municipio==="tizayuca";
}
