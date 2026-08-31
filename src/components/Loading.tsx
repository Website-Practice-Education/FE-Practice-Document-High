interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = 'Đang tải...', fullScreen = true }: LoadingProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? 'min-h-[60vh]' : 'py-12'}`}
    >
      <div className="loader-container animate-fade-in">
        <div className="loader-rings">
          <div className="loader-ring" />
          <div className="loader-ring" />
          <div className="loader-ring" />
        </div>
        <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
      </div>
    </div>
  );
}
