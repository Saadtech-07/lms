export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
