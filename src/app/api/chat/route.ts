import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ─── CART HELPER ─────────────────────────────────────────────────────────────
async function getOrCreateCart(supabase: any, storeId: string, sessionId: string) {
  const { data: cart } = await supabase
    .from('carts')
    .select('id, voucher_code')
    .eq('store_id', storeId)
    .eq('session_id', sessionId)
    .single()

  if (cart) return cart

  const { data: newCart } = await supabase
    .from('carts')
    .insert({ store_id: storeId, session_id: sessionId })
    .select('id, voucher_code')
    .single()

  return newCart
}

async function findProduct(supabase: any, storeId: string, query: string) {
  const { data } = await supabase
    .from('products')
    .select('id, name, sku, price, discount_price')
    .eq('store_id', storeId)
    .eq('status', 'PUBLISHED')
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(1)
    .single()
  return data
}

// ─── STOREFRONT TOOLS (AI Agent untuk Customer) ───────────────────────────────
const STORE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'tambah_ke_keranjang',
      description: 'Menambahkan produk ke keranjang belanja. Gunakan ketika pelanggan ingin membeli, memesan, atau menambahkan produk ke cart.',
      parameters: {
        type: 'object',
        properties: {
          nama_produk: { type: 'string', description: 'Nama produk atau SKU yang ingin dibeli' },
          jumlah: { type: 'integer', description: 'Jumlah yang ingin dibeli, default 1', default: 1 }
        },
        required: ['nama_produk']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'lihat_keranjang',
      description: 'Menampilkan isi keranjang belanja, total harga, diskon voucher, dan grand total. Gunakan ketika pelanggan ingin melihat cart atau menghitung total.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_jumlah_keranjang',
      description: 'Mengubah jumlah produk yang ada di keranjang belanja.',
      parameters: {
        type: 'object',
        properties: {
          nama_produk: { type: 'string', description: 'Nama produk yang ingin diubah jumlahnya' },
          jumlah_baru: { type: 'integer', description: 'Jumlah baru. Kirim 0 untuk menghapus.' }
        },
        required: ['nama_produk', 'jumlah_baru']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'hapus_dari_keranjang',
      description: 'Menghapus produk tertentu dari keranjang belanja.',
      parameters: {
        type: 'object',
        properties: {
          nama_produk: { type: 'string', description: 'Nama produk yang ingin dihapus dari cart' }
        },
        required: ['nama_produk']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pakai_voucher',
      description: 'Memvalidasi dan menerapkan kode voucher ke keranjang belanja. Juga bisa menghapus voucher jika kode dikosongkan.',
      parameters: {
        type: 'object',
        properties: {
          kode_voucher: { type: 'string', description: 'Kode voucher yang ingin digunakan' }
        },
        required: ['kode_voucher']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buat_draft_order',
      description: 'Membuat draft order / ringkasan pesanan dari isi keranjang. Gunakan saat pelanggan ingin checkout, konfirmasi pesanan, atau selesai belanja.',
      parameters: {
        type: 'object',
        properties: {
          nama_pelanggan: { type: 'string', description: 'Nama lengkap pelanggan (opsional)' },
          nomor_hp: { type: 'string', description: 'Nomor HP pelanggan (opsional)' },
          alamat: { type: 'string', description: 'Alamat pengiriman (opsional)' },
          catatan: { type: 'string', description: 'Catatan untuk pesanan (opsional)' }
        }
      }
    }
  }
]

// ─── DASHBOARD TOOLS (AI Agent untuk Owner) ───────────────────────────────────
const DASHBOARD_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'potong_stok',
      description: 'Kurangi stok produk berdasarkan nama atau SKU.',
      parameters: {
        type: 'object',
        properties: {
          pencarian: { type: 'string', description: 'Nama produk atau SKU' },
          jumlah: { type: 'integer', description: 'Jumlah yang dikurangi', default: 1 },
          catatan: { type: 'string', description: 'Catatan alasan pengurangan' }
        },
        required: ['pencarian', 'jumlah']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'tambah_stok',
      description: 'Tambah stok produk berdasarkan nama atau SKU.',
      parameters: {
        type: 'object',
        properties: {
          pencarian: { type: 'string', description: 'Nama produk atau SKU' },
          jumlah: { type: 'integer', description: 'Jumlah yang ditambahkan' },
          catatan: { type: 'string' }
        },
        required: ['pencarian', 'jumlah']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cek_stok',
      description: 'Cek stok produk berdasarkan nama atau SKU.',
      parameters: {
        type: 'object',
        properties: {
          pencarian: { type: 'string', description: 'Nama produk atau SKU' }
        },
        required: ['pencarian']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buat_voucher',
      description: 'Membuat voucher diskon baru untuk toko.',
      parameters: {
        type: 'object',
        properties: {
          kode: { type: 'string', description: 'Kode voucher (huruf kapital, tanpa spasi). Contoh: DISKON10' },
          tipe: { type: 'string', enum: ['PERCENT', 'FIX'], description: 'PERCENT = persentase, FIX = nominal rupiah' },
          nilai: { type: 'number', description: 'Nilai diskon. Untuk PERCENT: 10 = 10%. Untuk FIX: 50000 = Rp 50.000' },
          deskripsi: { type: 'string', description: 'Deskripsi voucher' },
          min_belanja: { type: 'number', description: 'Minimum pembelian dalam rupiah', default: 0 },
          maks_diskon: { type: 'number', description: 'Maksimum diskon dalam rupiah (untuk tipe PERCENT)' },
          maks_pemakaian: { type: 'integer', description: 'Batas jumlah pemakaian voucher' }
        },
        required: ['kode', 'tipe', 'nilai']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'produk_stok_hampir_habis',
      description: 'Tampilkan daftar produk yang stoknya menipis atau hampir habis.',
      parameters: {
        type: 'object',
        properties: {
          threshold: { type: 'integer', description: 'Batas stok yang dianggap menipis, default 5', default: 5 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'laporan_penjualan',
      description: 'Tampilkan ringkasan penjualan toko dalam periode tertentu.',
      parameters: {
        type: 'object',
        properties: {
          periode: { type: 'string', enum: ['hari_ini', 'minggu_ini', 'bulan_ini', 'semua'], description: 'Periode laporan' }
        },
        required: ['periode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'tambah_kategori',
      description: 'Menambahkan kategori produk baru ke toko.',
      parameters: {
        type: 'object',
        properties: {
          nama: { type: 'string', description: 'Nama kategori baru' }
        },
        required: ['nama']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'tambah_produk',
      description: 'Menambahkan produk baru ke toko.',
      parameters: {
        type: 'object',
        properties: {
          nama: { type: 'string', description: 'Nama produk' },
          harga: { type: 'number', description: 'Harga produk (contoh: 150000)' },
          deskripsi: { type: 'string', description: 'Deskripsi singkat produk' },
          nama_kategori: { type: 'string', description: 'Nama kategori yang sudah ada' }
        },
        required: ['nama', 'harga']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_harga_produk',
      description: 'Mengubah harga normal atau harga diskon (coret) suatu produk.',
      parameters: {
        type: 'object',
        properties: {
          pencarian: { type: 'string', description: 'Nama produk atau SKU' },
          harga_baru: { type: 'number', description: 'Harga normal baru. Kirim null jika hanya ingin mengubah diskon.' },
          harga_diskon: { type: 'number', description: 'Harga diskon baru. Kirim null atau 0 untuk menghapus diskon.' }
        },
        required: ['pencarian']
      }
    }
  }
]

// ─── Tool Executors ───────────────────────────────────────────────────────────
async function execTambahKeKeranjang(supabase: any, storeId: string, sessionId: string, namaProduk: string, jumlah: number) {
  const product = await findProduct(supabase, storeId, namaProduk)
  if (!product) return `❌ Produk "${namaProduk}" tidak ditemukan.`

  const unitPrice = product.discount_price || product.price
  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  if (!cart) return '❌ Gagal membuat keranjang.'

  // Cek apakah sudah ada di cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', product.id)
    .single()

  if (existing) {
    const newQty = existing.quantity + jumlah
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
    return `✅ **${product.name}** ditambahkan ke keranjang!\n- Jumlah sekarang: **${newQty} unit**\n- Harga satuan: Rp ${unitPrice.toLocaleString('id-ID')}`
  }

  await supabase.from('cart_items').insert({
    cart_id: cart.id, product_id: product.id, quantity: jumlah, unit_price: unitPrice
  })

  return `✅ **${product.name}** berhasil masuk keranjang!\n- Jumlah: **${jumlah} unit**\n- Harga: Rp ${(unitPrice * jumlah).toLocaleString('id-ID')}\n\nKetik *"lihat keranjang"* untuk melihat semua pesanan.`
}

async function execLihatKeranjang(supabase: any, storeId: string, sessionId: string) {
  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  if (!cart) return '❌ Gagal mengambil data keranjang.'

  const { data: items } = await supabase
    .from('cart_items')
    .select('quantity, unit_price, products(name)')
    .eq('cart_id', cart.id)

  if (!items || items.length === 0) return '🛒 Keranjang belanja Anda masih kosong.\n\nMau lihat produk apa yang tersedia? Silakan tanya saja!'

  const subtotal = items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
  let discount = 0

  if (cart.voucher_code) {
    const { data: v } = await supabase.from('vouchers').select('*').eq('store_id', storeId).eq('code', cart.voucher_code).single()
    if (v) {
      discount = v.type === 'PERCENT' ? Math.min(subtotal * v.value / 100, v.max_discount || Infinity) : v.value
    }
  }

  const total = Math.max(0, subtotal - discount)
  const itemList = items.map((i: any) =>
    `  • ${i.products?.name} x${i.quantity} — Rp ${(i.unit_price * i.quantity).toLocaleString('id-ID')}`
  ).join('\n')

  return `🛒 **Keranjang Belanja Anda:**\n\n${itemList}\n\n💰 Subtotal: Rp ${subtotal.toLocaleString('id-ID')}${discount > 0 ? `\n🎁 Diskon (${cart.voucher_code}): -Rp ${discount.toLocaleString('id-ID')}` : ''}\n**Total: Rp ${total.toLocaleString('id-ID')}**\n\nKetik *"checkout"* atau *"saya jadi beli"* untuk membuat pesanan.`
}

async function execUpdateJumlah(supabase: any, storeId: string, sessionId: string, namaProduk: string, jumlahBaru: number) {
  const product = await findProduct(supabase, storeId, namaProduk)
  if (!product) return `❌ Produk "${namaProduk}" tidak ditemukan.`

  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  const { data: item } = await supabase
    .from('cart_items')
    .select('id')
    .eq('cart_id', cart.id)
    .eq('product_id', product.id)
    .single()

  if (!item) return `❌ "${namaProduk}" tidak ada di keranjang Anda.`

  if (jumlahBaru <= 0) {
    await supabase.from('cart_items').delete().eq('id', item.id)
    return `🗑️ **${product.name}** dihapus dari keranjang.`
  }

  await supabase.from('cart_items').update({ quantity: jumlahBaru }).eq('id', item.id)
  return `✅ Jumlah **${product.name}** diubah menjadi **${jumlahBaru} unit**.`
}

async function execHapusDariKeranjang(supabase: any, storeId: string, sessionId: string, namaProduk: string) {
  const product = await findProduct(supabase, storeId, namaProduk)
  if (!product) return `❌ Produk "${namaProduk}" tidak ditemukan.`

  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id)
    .eq('product_id', product.id)

  if (error) return `❌ Gagal menghapus produk dari keranjang.`
  return `🗑️ **${product.name}** berhasil dihapus dari keranjang.`
}

async function execPakaiVoucher(supabase: any, storeId: string, sessionId: string, kodeVoucher: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'supabase.co') || ''}/api/cart/voucher`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ store_id: storeId, session_id: sessionId, code: kodeVoucher })
  })

  // Langsung proses via Supabase
  const voucher = await supabase
    .from('vouchers')
    .select('*')
    .eq('store_id', storeId)
    .eq('code', kodeVoucher.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!voucher.data) return `❌ Kode voucher **${kodeVoucher}** tidak ditemukan atau tidak aktif.`
  if (voucher.data.expires_at && new Date(voucher.data.expires_at) < new Date()) return '❌ Voucher sudah kadaluarsa.'
  if (voucher.data.max_uses && voucher.data.used_count >= voucher.data.max_uses) return '❌ Voucher sudah mencapai batas pemakaian.'

  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  const { data: items } = await supabase.from('cart_items').select('quantity, unit_price').eq('cart_id', cart.id)
  const subtotal = (items || []).reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)

  if (voucher.data.min_purchase && subtotal < voucher.data.min_purchase) {
    return `❌ Minimum pembelian **Rp ${voucher.data.min_purchase.toLocaleString('id-ID')}** untuk menggunakan voucher ini. Total belanja Anda saat ini: Rp ${subtotal.toLocaleString('id-ID')}.`
  }

  await supabase.from('carts').update({ voucher_code: kodeVoucher.toUpperCase() }).eq('id', cart.id)

  let discount = voucher.data.type === 'PERCENT'
    ? Math.min(subtotal * voucher.data.value / 100, voucher.data.max_discount || Infinity)
    : voucher.data.value

  return `🎁 Voucher **${kodeVoucher.toUpperCase()}** berhasil diterapkan!\n- Diskon: **Rp ${discount.toLocaleString('id-ID')}**\n- Total setelah diskon: **Rp ${Math.max(0, subtotal - discount).toLocaleString('id-ID')}**`
}

async function execBuatDraftOrder(supabase: any, storeId: string, sessionId: string, storeWhatsapp: string, args: any) {
  const cart = await getOrCreateCart(supabase, storeId, sessionId)
  if (!cart) return '❌ Cart tidak ditemukan.'

  const { data: items } = await supabase
    .from('cart_items')
    .select('quantity, unit_price, product_id, products(name, sku)')
    .eq('cart_id', cart.id)

  if (!items || items.length === 0) return '🛒 Keranjang Anda masih kosong! Tambahkan produk terlebih dahulu.'

  // Hitung total
  const subtotal = items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
  let discount = 0
  if (cart.voucher_code) {
    const { data: v } = await supabase.from('vouchers').select('*').eq('store_id', storeId).eq('code', cart.voucher_code).single()
    if (v) {
      discount = v.type === 'PERCENT' ? Math.min(subtotal * v.value / 100, v.max_discount || Infinity) : v.value
      await supabase.from('vouchers').update({ used_count: (v.used_count || 0) + 1 }).eq('id', v.id)
    }
  }
  const totalAmount = Math.max(0, subtotal - discount)

  // Order number
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
  const { data: order } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      order_number: orderNumber,
      status: 'PENDING',
      total_amount: totalAmount,
      notes: `Dibuat via AI Chatbot${args.nama_pelanggan ? ` - ${args.nama_pelanggan}` : ''}${args.catatan ? ` | ${args.catatan}` : ''}`
    })
    .select('id, order_number')
    .single()

  if (!order) return '❌ Gagal membuat order. Silakan coba lagi.'

  // Insert order items
  await supabase.from('order_items').insert(
    items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.unit_price * i.quantity
    }))
  )

  // Bersihkan cart
  await supabase.from('cart_items').delete().eq('cart_id', cart.id)
  await supabase.from('carts').update({ voucher_code: null }).eq('id', cart.id)

  const itemList = items.map((i: any) =>
    `  • ${i.products?.name} x${i.quantity} — Rp ${(i.unit_price * i.quantity).toLocaleString('id-ID')}`
  ).join('\n')

  const waLink = storeWhatsapp ? `\n\n📱 Konfirmasi pesanan via WhatsApp: https://wa.me/62${storeWhatsapp}?text=Halo,%20saya%20ingin%20konfirmasi%20pesanan%20nomor%20${order.order_number}` : ''

  return `🎉 **Pesanan Berhasil Dibuat!**

🔖 No. Pesanan: **${order.order_number}**
${args.nama_pelanggan ? `👤 Nama: **${args.nama_pelanggan}**\n` : ''}${args.nomor_hp ? `📱 HP: ${args.nomor_hp}\n` : ''}
**Detail Pesanan:**
${itemList}

💰 Subtotal: Rp ${subtotal.toLocaleString('id-ID')}${discount > 0 ? `\n🎁 Diskon: -Rp ${discount.toLocaleString('id-ID')}` : ''}
**Grand Total: Rp ${totalAmount.toLocaleString('id-ID')}**

✅ Pesanan Anda sudah masuk ke sistem kami. Tim kami akan segera menghubungi Anda!${waLink}`
}

// Dashboard tools
async function execPotongTambahStok(supabase: any, storeId: string, pencarian: string, jumlah: number, catatan: string, jenis: 'IN' | 'OUT') {
  const { data: products } = await supabase.from('products').select('id, name, sku, stock').eq('store_id', storeId).or(`name.ilike.%${pencarian}%,sku.ilike.%${pencarian}%`).limit(3)
  if (!products?.length) return `❌ Produk "${pencarian}" tidak ditemukan.`

  const product = products.find((p: any) => p.sku?.toLowerCase() === pencarian.toLowerCase()) || products[0]

  if (jenis === 'OUT' && product.stock < jumlah) return `⚠️ Stok tidak cukup. Sisa: **${product.stock} unit**.`

  const newStock = jenis === 'OUT' ? product.stock - jumlah : product.stock + jumlah
  await supabase.from('products').update({ stock: newStock }).eq('id', product.id)
  
  try {
    await supabase.from('inventory_histories').insert({ store_id: storeId, product_id: product.id, type: jenis, quantity: jumlah, notes: catatan || `Diubah via Asisten AI` })
  } catch (e) {
    // Ignore if inventory_histories doesn't exist
  }

  const icon = jenis === 'OUT' ? '📤' : '📥'
  const action = jenis === 'OUT' ? 'dikurangi' : 'ditambahkan'
  return `${icon} Stok **${product.name}** berhasil ${action}!\n- Perubahan: ${jenis === 'OUT' ? '-' : '+'}${jumlah} unit\n- Sebelum: ${product.stock} unit\n- **Sekarang: ${newStock} unit**`
}

async function execCekStok(supabase: any, storeId: string, pencarian: string) {
  const { data: products } = await supabase.from('products').select('id, name, sku, stock').eq('store_id', storeId).or(`name.ilike.%${pencarian}%,sku.ilike.%${pencarian}%`).limit(5)
  if (!products?.length) return `❌ Produk "${pencarian}" tidak ditemukan.`

  const results: string[] = []
  for (const p of products) {
    const icon = p.stock === 0 ? '🔴' : p.stock <= 5 ? '🟡' : '🟢'
    results.push(`${icon} **${p.name}**${p.sku ? ` (${p.sku})` : ''}: **${p.stock} unit**`)
  }
  return `📦 **Cek Stok:**\n${results.join('\n')}`
}

async function execBuatVoucher(supabase: any, storeId: string, args: any) {
  const kode = args.kode.toUpperCase().replace(/\s+/g, '')
  const { error } = await supabase.from('vouchers').insert({
    store_id: storeId,
    code: kode,
    description: args.deskripsi,
    type: args.tipe,
    value: args.nilai,
    min_purchase: args.min_belanja || 0,
    max_discount: args.maks_diskon,
    max_uses: args.maks_pemakaian,
    is_active: true
  })

  if (error) {
    if (error.message.includes('unique')) return `❌ Kode voucher **${kode}** sudah ada. Gunakan kode yang berbeda.`
    return `❌ Gagal membuat voucher: ${error.message}`
  }

  const nilaiStr = args.tipe === 'PERCENT' ? `${args.nilai}%` : `Rp ${Number(args.nilai).toLocaleString('id-ID')}`
  return `🎫 Voucher berhasil dibuat!\n- Kode: **${kode}**\n- Diskon: **${nilaiStr}**${args.min_belanja ? `\n- Min. belanja: Rp ${Number(args.min_belanja).toLocaleString('id-ID')}` : ''}${args.maks_pemakaian ? `\n- Batas pakai: ${args.maks_pemakaian}x` : ''}`
}

async function execProdukHampirHabis(supabase: any, storeId: string, threshold: number) {
  const { data } = await supabase
    .from('products')
    .select('name, sku, stock')
    .eq('store_id', storeId)
    .lte('stock', threshold)
    .order('stock')
    .limit(15)

  if (!data?.length) return `✅ Semua produk masih memiliki stok yang cukup (di atas ${threshold} unit).`

  const list = data.map((i: any) => {
    const icon = i.stock === 0 ? '🔴' : '🟡'
    return `${icon} **${i.name}** — **${i.stock} unit**${i.stock === 0 ? ' (HABIS)' : ''}`
  }).join('\n')

  return `⚠️ **Produk Stok Menipis (≤${threshold} unit):**\n\n${list}\n\nSegera restok sebelum kehabisan!`
}

async function execLaporanPenjualan(supabase: any, storeId: string, periode: string) {
  let from = new Date()
  const to = new Date()
  
  if (periode === 'hari_ini') from.setHours(0, 0, 0, 0)
  else if (periode === 'minggu_ini') from.setDate(from.getDate() - 7)
  else if (periode === 'bulan_ini') from.setDate(1)
  else from = new Date('2000-01-01')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .eq('store_id', storeId)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())

  if (!orders?.length) return `📊 Tidak ada data penjualan untuk periode ini.`

  const total = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0)
  const completed = orders.filter((o: any) => o.status === 'COMPLETED').length
  const pending = orders.filter((o: any) => o.status === 'PENDING').length

  const periodeLabel: Record<string, string> = {
    hari_ini: 'Hari Ini', minggu_ini: '7 Hari Terakhir', bulan_ini: 'Bulan Ini', semua: 'Semua Waktu'
  }

  return `📊 **Laporan Penjualan — ${periodeLabel[periode]}**\n\n- Total Order: **${orders.length} pesanan**\n- Selesai: ${completed} | Pending: ${pending}\n- **Total Penjualan: Rp ${total.toLocaleString('id-ID')}**`
}

async function execTambahKategori(supabase: any, storeId: string, nama: string) {
  const slug = nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const { data, error } = await supabase.from('categories').insert({ store_id: storeId, name: nama, slug }).select('id').single()
  if (error) return `❌ Gagal menambahkan kategori: ${error.message}`
  return `✅ Kategori **${nama}** berhasil ditambahkan.`
}

async function execTambahProduk(supabase: any, storeId: string, nama: string, harga: number, deskripsi: string, namaKategori?: string) {
  let categoryId = null
  if (namaKategori) {
    const { data: cat } = await supabase.from('categories').select('id').eq('store_id', storeId).ilike('name', `%${namaKategori}%`).single()
    if (cat) categoryId = cat.id
  }
  const { data, error } = await supabase.from('products').insert({
    store_id: storeId, name: nama, price: harga, description: deskripsi, status: 'PUBLISHED', category_id: categoryId
  }).select('id').single()
  if (error) return `❌ Gagal menambahkan produk: ${error.message}`
  return `✅ Produk **${nama}** berhasil ditambahkan dengan harga Rp ${harga.toLocaleString('id-ID')}.${categoryId ? '' : ' (Tanpa kategori)'}`
}

async function execUpdateHargaProduk(supabase: any, storeId: string, pencarian: string, hargaBaru: number | null, hargaDiskon: number | null) {
  const { data: products } = await supabase.from('products').select('id, name, price, discount_price').eq('store_id', storeId).ilike('name', `%${pencarian}%`).limit(1)
  if (!products?.length) return `❌ Produk "${pencarian}" tidak ditemukan.`
  const p = products[0]
  
  const updates: any = {}
  if (hargaBaru !== null) updates.price = hargaBaru
  if (hargaDiskon !== undefined) updates.discount_price = hargaDiskon === 0 ? null : hargaDiskon
  
  const { error } = await supabase.from('products').update(updates).eq('id', p.id)
  if (error) return `❌ Gagal update harga: ${error.message}`
  return `✅ Harga **${p.name}** berhasil diupdate.\n- Harga Normal: Rp ${(hargaBaru ?? p.price).toLocaleString('id-ID')}\n- Harga Diskon: ${hargaDiskon ? `Rp ${hargaDiskon.toLocaleString('id-ID')}` : (hargaDiskon === 0 ? 'Tidak ada' : (p.discount_price ? `Rp ${p.discount_price.toLocaleString('id-ID')}` : 'Tidak ada'))}`
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { messages, storeSlug, sessionId } = await request.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key belum dikonfigurasi.' }, { status: 500 })
    }

    const supabase = await createClient()
    let systemPrompt = ''
    let storeId = ''
    let storeWhatsapp = ''
    const isDashboard = !storeSlug

    if (storeSlug) {
      // ── TOKO PUBLIK ───────────────────────────────────────────────────────
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, description, whatsapp, address, instagram')
        .eq('slug', storeSlug)
        .single()

      if (store) {
        storeId = store.id
        storeWhatsapp = store.whatsapp || ''
      }

      const { data: prods } = store
        ? await supabase.from('products').select('name, sku, price, discount_price, description').eq('store_id', store.id).eq('status', 'PUBLISHED').limit(30)
        : { data: [] }

      const productList = (prods || []).map((p: any) => {
        const harga = p.discount_price ? `Rp ${p.discount_price.toLocaleString('id-ID')} (coret Rp ${p.price.toLocaleString('id-ID')})` : `Rp ${p.price.toLocaleString('id-ID')}`
        return `- ${p.name}${p.sku ? ` [${p.sku}]` : ''}: ${harga}${p.description ? ` — ${p.description}` : ''}`
      }).join('\n')

      const { data: activeVouchers } = await supabase.from('vouchers').select('code, type, value, min_purchase, description').eq('store_id', storeId).eq('is_active', true)
      const voucherInfo = (activeVouchers || []).map((v: any) => `- Kode: ${v.code} — Diskon ${v.type === 'PERCENT' ? v.value + '%' : 'Rp ' + v.value.toLocaleString('id-ID')}${v.min_purchase > 0 ? ` (min. Rp ${v.min_purchase.toLocaleString('id-ID')})` : ''}`).join('\n')

      let ragContext = ''
      try {
        const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ''
        if (lastUserMessage) {
          let queryEmbedding: number[] | null = null

          if (apiKey.startsWith('sk-')) {
            const res = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({ input: lastUserMessage, model: 'text-embedding-3-small' })
            })
            if (res.ok) {
              const data = await res.json()
              queryEmbedding = data.data[0].embedding
            }
          } else if (apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text: lastUserMessage }] }
              })
            })
            if (res.ok) {
              const data = await res.json()
              let emb = data.embedding.values
              if (emb.length < 1536) {
                const padding = new Array(1536 - emb.length).fill(0)
                queryEmbedding = [...emb, ...padding]
              } else {
                queryEmbedding = emb
              }
            }
          }

          if (queryEmbedding) {
            const { data: kb } = await supabase.rpc('match_knowledge', {
              query_embedding: queryEmbedding,
              match_threshold: 0.7,
              match_count: 3,
              p_store_id: storeId
            })
            if (kb && kb.length > 0) {
              ragContext = `\n\nKNOWLEDGE BASE (Gunakan informasi ini jika relevan untuk menjawab pelanggan):\n` + 
                kb.map((k: any) => `[${k.title}]\n${k.content}`).join('\n\n')
            }
          }
        }
      } catch (e) {
        console.error('RAG Error:', e)
      }

      systemPrompt = `Kamu adalah AI Shopping Assistant toko "${store?.name || storeSlug}" yang canggih, ramah, dan membantu. Kamu bisa menjawab pertanyaan DAN melakukan aksi nyata seperti menambahkan produk ke keranjang, menerapkan voucher, dan membuat pesanan.

INFORMASI TOKO:
- Nama: ${store?.name}
- Deskripsi: ${store?.description || '-'}
- Alamat: ${store?.address || '-'}
- WhatsApp: ${storeWhatsapp ? `+62${storeWhatsapp}` : '-'}
- Instagram: ${store?.instagram ? `@${store.instagram}` : '-'}

KATALOG PRODUK:
${productList || 'Belum ada produk.'}

VOUCHER AKTIF:
${voucherInfo || 'Tidak ada voucher aktif saat ini.'}${ragContext}

KEMAMPUANMU:
- 🛒 Tambah produk ke keranjang: "Saya mau beli X produk A"
- 👀 Lihat keranjang: "Lihat keranjang" / "Berapa totalnya?"
- ✏️ Update jumlah: "Ubah sepatu jadi 2"
- 🗑️ Hapus dari cart: "Hapus produk A"
- 🎁 Pakai voucher: "Pakai voucher DISKON10"
- ✅ Checkout: "Saya jadi beli" / "Checkout sekarang"

PANDUAN:
- Selalu ramah dan dorong pelanggan untuk membeli
- Jika pelanggan tertarik, langsung tawarkan untuk menambahkan ke keranjang
- Gunakan tool yang tersedia untuk melakukan aksi, jangan hanya menjawab teks
- Jawab dalam Bahasa Indonesia yang natural`

    } else {
      // ── DASHBOARD OWNER ───────────────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      let dashboardProductList = ''
      if (user) {
        const { data: store } = await supabase.from('stores').select('id, name').eq('owner_id', user.id).single()
        if (store) {
          storeId = store.id
          const { data: prods } = await supabase.from('products').select('name, sku, stock').eq('store_id', store.id).limit(50)
          dashboardProductList = (prods || []).map((p: any) => `- ${p.name}${p.sku ? ` [${p.sku}]` : ''}: ${p.stock} unit`).join('\n')
        }
      }

      systemPrompt = `Kamu adalah AI Owner Assistant cerdas untuk dashboard toko. Kamu bisa menjawab pertanyaan sekaligus menjalankan aksi nyata untuk mengelola toko.

KATALOG PRODUK TOKO SAAT INI:
${dashboardProductList || 'Belum ada produk.'}

KEMAMPUANMU:
- 📦 Kelola stok: potong stok, tambah stok, cek stok
- 🎫 Buat voucher diskon
- ⚠️ Cek produk hampir habis
- 📊 Laporan penjualan
- ✍️ Buat deskripsi produk, caption media sosial
- 💡 Strategi pemasaran & pricing

PANDUAN:
- Gunakan tool yang tersedia untuk aksi nyata ke database
- Jika ditanya "ada produk apa saja", jawab berdasarkan KATALOG PRODUK di atas.
- Konfirmasi dulu jika aksi bersifat permanen dan berisiko
- Bahasa Indonesia profesional tapi ramah
- Gunakan emoji secukupnya`
    }

    // ── Kirim ke AI ───────────────────────────────────────────────────────
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ]

    const isOpenAI = apiKey.startsWith('sk-')
    const apiUrl = isOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions'
    const model = isOpenAI ? 'gpt-4o-mini' : 'llama-3.1-8b-instant'

    const bodyPayload: any = { model, messages: aiMessages, temperature: 0.7, max_tokens: 1024 }
    if (storeSlug) {
      bodyPayload.tools = STORE_TOOLS
      bodyPayload.tool_choice = 'auto'
    } else if (isDashboard) {
      bodyPayload.tools = DASHBOARD_TOOLS
      bodyPayload.tool_choice = 'auto'
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(bodyPayload)
    })

    if (!response.ok) {
      const errData = await response.json()
      return NextResponse.json({ error: `Error AI: ${errData.error?.message || 'Unknown'}` }, { status: 500 })
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    // ── Handle Tool Calls ─────────────────────────────────────────────────
    if (choice?.finish_reason === 'tool_calls' && choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0]
      const fnName = toolCall.function.name
      const fnArgs = JSON.parse(toolCall.function.arguments || '{}') || {}

      let toolResult = ''
      const sid = sessionId || 'guest-default'

      // Storefront tools
      if (fnName === 'tambah_ke_keranjang') toolResult = await execTambahKeKeranjang(supabase, storeId, sid, fnArgs.nama_produk, fnArgs.jumlah ?? 1)
      else if (fnName === 'lihat_keranjang') toolResult = await execLihatKeranjang(supabase, storeId, sid)
      else if (fnName === 'update_jumlah_keranjang') toolResult = await execUpdateJumlah(supabase, storeId, sid, fnArgs.nama_produk, fnArgs.jumlah_baru)
      else if (fnName === 'hapus_dari_keranjang') toolResult = await execHapusDariKeranjang(supabase, storeId, sid, fnArgs.nama_produk)
      else if (fnName === 'pakai_voucher') toolResult = await execPakaiVoucher(supabase, storeId, sid, fnArgs.kode_voucher)
      else if (fnName === 'buat_draft_order') toolResult = await execBuatDraftOrder(supabase, storeId, sid, storeWhatsapp, fnArgs)
      // Dashboard tools
      else if (fnName === 'potong_stok') toolResult = await execPotongTambahStok(supabase, storeId, fnArgs.pencarian, fnArgs.jumlah, fnArgs.catatan, 'OUT')
      else if (fnName === 'tambah_stok') toolResult = await execPotongTambahStok(supabase, storeId, fnArgs.pencarian, fnArgs.jumlah, fnArgs.catatan, 'IN')
      else if (fnName === 'cek_stok') toolResult = await execCekStok(supabase, storeId, fnArgs.pencarian)
      else if (fnName === 'buat_voucher') toolResult = await execBuatVoucher(supabase, storeId, fnArgs)
      else if (fnName === 'produk_stok_hampir_habis') toolResult = await execProdukHampirHabis(supabase, storeId, fnArgs.threshold ?? 5)
      else if (fnName === 'laporan_penjualan') toolResult = await execLaporanPenjualan(supabase, storeId, fnArgs.periode)
      else if (fnName === 'tambah_kategori') toolResult = await execTambahKategori(supabase, storeId, fnArgs.nama)
      else if (fnName === 'tambah_produk') toolResult = await execTambahProduk(supabase, storeId, fnArgs.nama, fnArgs.harga, fnArgs.deskripsi, fnArgs.nama_kategori)
      else if (fnName === 'update_harga_produk') toolResult = await execUpdateHargaProduk(supabase, storeId, fnArgs.pencarian, fnArgs.harga_baru ?? null, fnArgs.harga_diskon ?? null)
      else toolResult = '❌ Fungsi tidak dikenal.'

      // Follow-up ke AI dengan hasil tool
      const followUpMsgs = [
        ...aiMessages,
        { role: 'assistant', content: null, tool_calls: choice.message.tool_calls },
        { role: 'tool', tool_call_id: toolCall.id, content: toolResult }
      ]

      const followUp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: followUpMsgs, temperature: 0.7, max_tokens: 512 })
      })

      if (followUp.ok) {
        const fuData = await followUp.json()
        const finalText = fuData.choices?.[0]?.message?.content || toolResult
        return NextResponse.json({ message: finalText, toolResult, toolName: fnName })
      }

      return NextResponse.json({ message: toolResult, toolName: fnName })
    }

    return NextResponse.json({ message: choice?.message?.content || 'Maaf, tidak ada respons.' })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
