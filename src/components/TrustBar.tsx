const items = [
  "WordPress", "Blogger", "Amazon Associates", "ShareASale", "Shopify Collabs", "Impact", "CJ Affiliate", "Rakuten",
];

export default function TrustBar() {
  const loop = [...items, ...items];
  return (
    <div className="border-y border-brand-slate/20 bg-brand-white py-6 overflow-hidden">
      <p className="text-center text-xs font-mono uppercase tracking-widest text-paper-500/60 mb-4">
        Publishes to the platforms you already use
      </p>
      <div className="relative">
        <div className="flex gap-14 animate-marquee whitespace-nowrap w-max">
          {loop.map((item, i) => (
            <span key={i} className="text-brand-slate/50 font-heading text-lg italic">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
