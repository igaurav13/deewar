export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8 py-10 sm:py-14">
      <div className="h-9 w-48 bg-sand-light rounded-sm animate-pulse mb-10" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-10">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-sand-light rounded-sm animate-pulse" />
            <div className="h-4 w-3/4 bg-sand-light rounded-sm animate-pulse mt-3" />
            <div className="h-3 w-1/2 bg-sand-light rounded-sm animate-pulse mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
