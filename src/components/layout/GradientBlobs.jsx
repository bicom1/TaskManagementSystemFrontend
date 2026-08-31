import { motion } from 'framer-motion';

const blobs = [
  {
    className: 'absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-300/30 blur-[120px]',
    animate: { x: [0, 40, -15, 0], y: [0, 30, 15, 0], scale: [1, 1.08, 0.97, 1] },
    duration: 26,
  },
  {
    className: 'absolute -bottom-52 -right-32 h-[560px] w-[560px] rounded-full bg-brand-400/22 blur-[140px]',
    animate: { x: [0, -30, 20, 0], y: [0, -35, -10, 0], scale: [1, 0.95, 1.06, 1] },
    duration: 32,
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