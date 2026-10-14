import { motion } from "framer-motion";

type Props = {
  className?: string;
  image: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
};

export default function OpeningStudioSection({
  className = "",
  image,
  title,
  description,
  buttonText,
  buttonHref,
}: Props) {
  return (
    <section
      className={`w-full bg-white ${className}`}
      aria-label="Opening a studio"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-2xl border border-brand-line shadow-editorial"
        >
          <img
            src={image}
            alt={title}
            className="w-full h-[420px] object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-left"
        >
          <h2 className="mm-heading mb-4 text-3xl sm:text-5xl">
            {title}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-8">{description}</p>
          <a
            href={buttonHref}
            className="mm-button"
          >
            {buttonText}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
