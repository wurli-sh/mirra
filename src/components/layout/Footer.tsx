import { motion } from "framer-motion";
import { Dithering } from "@paper-design/shaders-react";
import { scrollViewport } from "@/lib/animations";
import { ExternalLink } from "lucide-react";

const links = [
  { label: "GitHub", href: "https://github.com/wurli-sh/mirra" },
  { label: "Somnia Explorer", href: "https://shannon-explorer.somnia.network" },
  {
    label: "SimpleDEX",
    href: "https://shannon-explorer.somnia.network/address/0x...",
  },
];

export function Footer() {
  return (
    <footer
      className="relative mt-24 -mx-6 flex flex-col items-center justify-center overflow-hidden bg-secondary"
      style={{ minHeight: "30vh" }}
    >
      {/* Dithering shader background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <Dithering
          style={{ width: "100%", height: "100%" }}
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          scale={0.5}
          speed={0.02}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full px-6 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={scrollViewport}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <p className="mx-auto max-w-xl text-center text-base leading-relaxed text-white/80 text-pretty">
          Leaders trade. Followers mirror. No bots, no backend, no trust
          assumptions. Fully on-chain copy-trading through reactive contracts.
        </p>

        {/* Links */}
        <div className="flex items-center gap-5">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors duration-150"
            >
              {link.label}
              <ExternalLink size={10} />
            </a>
          ))}
        </div>

        {/* Branding */}
        <div className="flex items-center gap-2">
          <span className="rounded bg-primary px-2 py-0.5 text-xs font-semibold text-secondary">
            Somnia
          </span>
          <span className="text-xs text-white/30">Shannon Testnet</span>
        </div>
      </motion.div>
    </footer>
  );
}
