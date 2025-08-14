import Head from "next/head";
import { GetServerSideProps } from "next";
import { fetchConfig } from "../../lib/fetchConfig";

type Section = { title: string; content: string };

type Props = {
  title: string;
  sections: Section[];
};

export default function LegalPage({ title, sections }: Props) {
  return (
    <>
      <Head>
        <title>{title} | Melocotón Move</title>
        <meta name="robots" content="noindex" />
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
      title: cfg?.returnPolicy?.title,
      sections: cfg?.returnPolicy?.sections,
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
