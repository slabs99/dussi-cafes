"use client";

import ProductCard, { type Product } from "./ProductCard";

interface Props {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
  icon: React.ReactNode;
}

export default function CuratedSection({ id, title, subtitle, products, icon }: Props) {
  return (
    <section id={id} className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Section header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-8 h-8 flex items-center justify-center text-[#2D6A4F] flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
            {title}
          </h2>
          <p className="text-sm text-stone-500 mt-1 leading-relaxed max-w-lg">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-10">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}
