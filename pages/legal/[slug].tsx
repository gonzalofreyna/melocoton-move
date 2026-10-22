import Head from "next/head";
import { GetServerSideProps } from "next";
import { fetchConfig } from "../../lib/fetchConfig";

type Section = { title: string; content: string };

// Política visible para clientes y Merchant Center. Mantener sincronizada con la
// configuración editable del administrador para evitar textos contradictorios.
const merchantReturnPolicy: Section[] = [
  {
    title: "Plazo para cambios o devoluciones",
    content: "Puedes solicitar cambios o devoluciones ordinarias de productos no personalizados dentro de los 15 días naturales posteriores a su entrega. Para iniciar tu solicitud, escribe a contacto@melocotonmove.com. Este plazo no limita los derechos que correspondan por productos defectuosos, incorrectos o por incumplimiento de la compra.",
  },
  {
    title: "Condiciones de los artículos",
    content: "Para devoluciones ordinarias, los productos deben estar sin uso, en perfectas condiciones y conservar su empaque y accesorios originales. Los artículos personalizados no admiten cambios, cancelaciones o devoluciones por motivos de preferencia una vez procesados. Esto no limita los derechos legales aplicables por defectos, errores de entrega o incumplimientos.",
  },
  {
    title: "Producto recibido por error o defectuoso",
    content: "Si recibes un artículo distinto del solicitado o con un defecto, contáctanos en contacto@melocotonmove.com para revisar tu caso y gestionar la solución correspondiente. Cuando el problema sea atribuible a Melocotón Move, cubriremos los gastos de devolución que correspondan.",
  },
  {
    title: "Costos de devolución",
    content: "Para las devoluciones ordinarias no atribuibles a Melocotón Move, el cliente cubre el envío de regreso. No cobramos tarifa de reposición o aprovisionamiento.",
  },
  {
    title: "Reembolsos",
    content: "Una vez recibido y verificado el producto, el reembolso se realizará mediante el método de pago original dentro de un plazo máximo de 21 días naturales, sin perjuicio de los plazos más favorables que establezca la legislación aplicable.",
  },
];

type Props = {
  title: string;
  sections: Section[];
};

export default function LegalPage({ title, sections }: Props) {
  return (
    <>
      <Head>
        <title>{title} | Melocotón Move</title>
        {title !== "Políticas de Devolución" && title !== "Política de devoluciones" && <meta name="robots" content="noindex" />}
      </Head>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="space-y-8 leading-relaxed">
          {sections.map((s, i) => (
            <section key={i}>
              {s.title && (
                <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
              )}
              <p className="whitespace-pre-line text-gray-700">{s.content}</p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = String(params?.slug || "");
  const cfg = await fetchConfig();

  // Mapeo slug -> bloque + flag
  const map: Record<
    string,
    { ok: boolean; title?: string; sections?: Section[] }
  > = {
    "aviso-de-privacidad": {
      ok: cfg?.featureFlags?.showPrivacyPolicy ?? true,
      title: cfg?.privacyPolicy?.title,
      sections: cfg?.privacyPolicy?.sections,
    },
    "terminos-y-condiciones": {
      ok: cfg?.featureFlags?.showTermsAndConditions ?? true,
      title: cfg?.termsAndConditions?.title,
      sections: cfg?.termsAndConditions?.sections,
    },
    // usa tu returnPolicy para cancelaciones/devoluciones
    "politica-de-cancelaciones": {
      ok: cfg?.featureFlags?.showReturnPolicy ?? true,
      title: "Políticas de Devolución",
      sections: merchantReturnPolicy,
    },
  };

  const entry = map[slug];
  if (!entry?.ok || !entry.title || !entry.sections) {
    return { notFound: true };
  }

  return {
    props: {
      title: entry.title,
      sections: entry.sections,
    },
  };
};
