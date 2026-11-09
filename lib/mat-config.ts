export type MatShape = "capsula" | "clasico" | "bala";
export type MatFinish =
  | { type: "solid"; value: string; label: string }
  | { type: "texture"; value: string; label: string };
export const MAT_DIMENSIONS: Record<MatShape, { height: number; width: number }> = {
  clasico: { height: 182, width: 69 },
  bala: { height: 182, width: 69 },
  capsula: { height: 181, width: 68 },
};
export const MAT_THICKNESS_MM = 5;
export const MAT_PRICE = 1399;

export const matShapes: { id: MatShape; label: string }[] = [
  { id: "capsula", label: "Cápsula" },
  { id: "clasico", label: "Clásico" },
  { id: "bala", label: "Bala" },
];

export const solidColors = [
  "#3D3A3B",
  "#7A7A78",
  "#F7F7F7",
  "#FFD71E",
  "#F2DADD",
  "#DE765F",
  "#D46D78",
  "#B8AAA0",
  "#D5CEBC",
  "#285D48",
  "#24548F",
  "#ADB58B",
  "#9ABAB4",
  "#B08BBB",
  "#73A0BA",
  "#4C4D53",
  "#E62623",
  "#2F9A91",
  "#B3AFE6",
  "#A89EAD",
  "#66676D",
  "#8B604E",
  "#741D32", // Vino marrón / guinda
  "#60456A",
  "#FFF0C3",
  "#AED0DB",
  "#F6D1A5",
  "#C97643",
  "#F3B5BE",
];
export const solidColorNames: Record<string, string> = {
  "#3D3A3B": "Negro carbón",
  "#7A7A78": "Gris piedra",
  "#F7F7F7": "Blanco nieve",
  "#FFD71E": "Amarillo sol",
  "#F2DADD": "Rosa empolvado",
  "#DE765F": "Terracota",
  "#D46D78": "Rosa antiguo",
  "#B8AAA0": "Arena cálida",
  "#D5CEBC": "Marfil",
  "#285D48": "Verde bosque",
  "#24548F": "Azul profundo",
  "#ADB58B": "Verde salvia",
  "#9ABAB4": "Verde agua",
  "#B08BBB": "Lavanda",
  "#73A0BA": "Azul cielo",
  "#4C4D53": "Grafito",
  "#E62623": "Rojo intenso",
  "#2F9A91": "Turquesa",
  "#B3AFE6": "Lila pastel",
  "#A89EAD": "Malva grisáceo",
  "#66676D": "Gris humo",
  "#8B604E": "Café cacao",
  "#741D32": "Vino",
  "#60456A": "Ciruela",
  "#FFF0C3": "Vainilla",
  "#AED0DB": "Azul bruma",
  "#F6D1A5": "Durazno",
  "#C97643": "Canela",
  "#F3B5BE": "Rosa suave",
};
