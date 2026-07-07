export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <h1 className="font-bold text-xl text-text-primary tracking-wide">TaskFlow</h1>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
