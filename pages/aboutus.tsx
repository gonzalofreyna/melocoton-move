import { motion } from "framer-motion";
import OpeningStudioSection from "../components/OpeningStudioSection";
import { useAppConfig } from "../context/ConfigContext";

export default function AboutUs() {
  const { config, loading: configLoading } = useAppConfig();

  if (configLoading) return null;

  return (
    <main className="flex flex-col items-center text-center bg-gray-50">
      {/* OPENING STUDIO SECTION */}
      {config?.featureFlags?.showOpeningStudio &&
        config?.openingStudio?.enabled && (
          <section className="py-20 px-6 bg-white w-full">
            <div className="max-w-6xl mx-auto">
              <OpeningStudioSection
                className="w-full"
                image={config.openingStudio.image}
                title={config.openingStudio.title}
                description={config.openingStudio.description}
                buttonText={config.openingStudio.buttonText}
                buttonHref={
                  config.openingStudio.buttonHref ||
                  "/products?category=reformer"
                }
              />
            </div>
          </section>
        )}

      {/* BENEFICIOS (desde CONFIG) */}
      {config?.featureFlags?.showBenefits && config?.benefits?.enabled && (
        <section className="py-20 px-6 bg-gray-50 w-full">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-brand-blue mb-12"
          >
            {config.benefits.header}
          </motion.h2>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-3 max-w-6xl mx-auto">
            {config.benefits.items.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-bold text-brand-beige mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
