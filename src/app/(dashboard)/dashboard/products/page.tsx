import { getProducts } from '@/actions/product.actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Produk</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{products.length} produk terdaftar</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          + Tambah Produk
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-100 text-center py-16">
          <div className="text-3xl mb-3">📦</div>
          <p className="text-sm font-medium text-zinc-600">Belum ada produk</p>
          <p className="text-xs text-zinc-400 mt-1">Mulai dengan menambahkan produk pertama Anda</p>
          <Link
            href="/dashboard/products/new"
            className="inline-block mt-4 text-xs bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">Produk</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-500">SKU</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500">Harga</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                        {product.images && product.images[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm text-zinc-300">📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-800 truncate">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-zinc-400 truncate max-w-[200px]">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 text-xs">{product.sku || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {Array.isArray(product.variants) && product.variants.length > 0 ? (
                      <div>
                        <div className="text-xs text-zinc-400 mb-0.5">Mulai dari</div>
                        <div className="font-medium text-zinc-900">
                          Rp {Math.min(...product.variants.map((v: any) => Number(v.price) || 0)).toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-zinc-400">{product.variants.length} varian</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-zinc-900">Rp {(product.price || 0).toLocaleString('id-ID')}</div>
                        {product.discount_price && (
                          <div className="text-xs text-red-500">Diskon: Rp {product.discount_price.toLocaleString('id-ID')}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${product.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' :
                        product.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-zinc-50 text-zinc-500'}`}>
                      <span className={`w-1 h-1 rounded-full ${product.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-zinc-400'}`}></span>
                      {product.status === 'PUBLISHED' ? 'Aktif' : product.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="text-xs font-medium bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-md hover:bg-zinc-200 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
