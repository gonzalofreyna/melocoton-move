// Catálogo único de archivos audiovisuales propiedad de Melocotón Move.
// Los títulos son editoriales: NO representan testimonios, escenas verificadas ni fechas.
export const VIDEO_MEDIA_BASE =
  "https://melocoton-move-assets.s3.us-east-1.amazonaws.com/videos/customers/";

export const customerVideos = [
  { id: "4125f23c3a9141589692e1587489afbe", title: "Lo que nos mueve" },
  { id: "24db6552be06494c896b8e4e482cfd74", title: "El movimiento se comparte" },
  { id: "2ae15857335243c985f2bf61e3f2bd6f", title: "Haz espacio para ti" },
  { id: "3e88ea26526f4bb3acdf65239cdbc18c", title: "A tu propio ritmo" },
  { id: "673bb17dd6d44ead98ce01abeef94d76", title: "Una práctica, mil maneras" },
  { id: "6d8f1b55f2534a3e9861e4e48876b79f", title: "Momentos que inspiran" },
  { id: "a342be43105946bc913bc623834ba666", title: "Tu espacio, tu práctica" },
  { id: "b73ecf845b974c5e84f2ab9ba63d49a2", title: "El gusto de moverte" },
  { id: "df5886d824ca4205bd90273183390973", title: "La práctica continúa" },
] as const;

export const customerVideoSource = (id: string) => `${VIDEO_MEDIA_BASE}${id}.mp4`;
export const customerVideoPoster = (id: string) => `${VIDEO_MEDIA_BASE}portada/${id}-poster.webp`;
