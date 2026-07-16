import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Le repo a un package-lock.json à la racine (backend Node.js dans src/) :
  // on force explicitement la racine du projet dashboard pour éviter que Next.js
  // ne se trompe de dossier de travail.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
