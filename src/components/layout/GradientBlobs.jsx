import { motion } from 'framer-motion';

const blobs = [
  {
    className: 'absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/40 blur-[110px]',
    animate: { x: [0, 50, -20, 0], y: [0, 40, 20, 0], scale: [1, 1.15, 0.95, 1] },
    duration: 16,
  },
  {
    className: 'absolute -bottom-48 -right-32 h-[560px] w-[560px] rounded-full bg-bloom-coral/30 blur-[130px]',
    animate: { x: [0, -40, 30, 0], y: [0, -50, -10, 0], scale: [1, 0.9, 1.1, 1] },
    duration: 20,
  },
  {
    className: 'absolute left-1/2 top-1/4 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-violet-400/25 blur-[100px]',
    animate: { x: [0, 30, -30, 0], y: [0, -25, 25, 0], scale: [1, 1.1, 0.9, 1] },
    duration: 24,
  },
  {
    className: 'absolute right-1/4 bottom-1/3 h-[240px] w-[240px] rounded-full bg-sky-300/20 blur-[90px]',
    animate: { x: [0, -20, 20, 0], y: [0, 30, -20, 0], scale: [1, 1.2, 1, 1] },
    duration: 18,
  },
];

export function GradientBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`${blob.className} mix-blend-multiply`}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* subtle grain/noise overlay for texture, remove if not desired */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
    </div>
  );
}