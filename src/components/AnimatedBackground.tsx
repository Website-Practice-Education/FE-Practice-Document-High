export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 animate-float"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-25 animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full opacity-20 animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle, #a78bfa 0%, transparent 70%)',
          filter: 'blur(55px)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 40%, #f0f9ff 100%)',
        }}
      />
    </div>
  );
}
