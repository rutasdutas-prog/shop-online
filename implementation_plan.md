# Peningkatan Fitur & UI/UX TokoKita

Rencana ini merangkum langkah-langkah untuk memenuhi semua permintaan terbaru Anda, termasuk pembaruan inventaris, diskon persentase, animasi, dan perbaikan tampilan.

## User Review Required

> [!IMPORTANT]
> **Terkait Halaman CMS:**
> Anda meminta "buat 1 halaman cms untuk supaya dapat edit sendiri". Saya berasumsi ini adalah halaman **"Tampilan Toko" (Storefront CMS)** di dalam Dashboard tenant, di mana pemilik toko bisa mengubah:
> 1. Teks sambutan (Hero Title & Subtitle)
> 2. Warna tema utama toko (Theme Color)
> 3. Layout (misal: Sembunyikan/Tampilkan Banner)
> 
> *Apakah asumsi ini benar, atau Anda bermaksud CMS untuk Landing Page utama platform TokoKita? Saya akan melanjutkan dengan asumsi CMS untuk Storefront tenant.*

## Proposed Changes

### 1. Manajemen Stok Inventaris
#### [MODIFY] `src/app/(dashboard)/dashboard/inventory/page.tsx`
- Mengubah tabel inventaris menjadi interaktif.
- Menambahkan tombol "Update Stok" untuk setiap baris produk.
- Menampilkan sisa stok dengan jelas.

#### [NEW] `src/actions/inventory.actions.ts`
- Membuat Server Action untuk memproses pembaruan stok (`updateStock`).

### 2. Diskon Produk (Persentase & Fix)
#### [MODIFY] `src/app/(dashboard)/dashboard/products/new/page.tsx` & `src/app/(dashboard)/dashboard/products/[id]/edit/edit-form.tsx`
- Menambahkan *toggle* / *switch* tipe diskon: "Nominal (Rp)" atau "Persentase (%)".
- Logika otomatis: Jika memilih %, sistem akan menghitung potongan harganya sebelum disimpan ke database.

### 3. Animasi (Framer Motion / CSS)
#### [MODIFY] `package.json`
- Menginstal `framer-motion` untuk animasi transisi halaman yang *smooth* tanpa memberatkan web.
- Jika Anda lebih suka ringan, kita akan menggunakan Tailwind CSS animations (fade-in, slide-up). Saya akan menggunakan Tailwind `tw-animate-css` dan *utility classes* bawaan untuk memastikan web tetap sangat ringan.

### 4. Perbaikan UI Storefront & Bug Gambar
#### [MODIFY] `src/app/(storefront)/[slug]/page.tsx`
- **Bug Gambar:** Memastikan *URL* gambar dari Supabase dirender dengan benar. Jika kosong, *placeholder* yang lebih elegan akan ditampilkan.
- **UI Upgrade:** Merombak total susunan *header* dan *banner* agar lebih menyatu (seamless) dan terlihat lebih mewah dibandingkan "Foto 1".
- Menambahkan animasi muncul (fade-up) saat produk di-_scroll_.

### 5. Halaman CMS (Store Appearance)
#### [NEW] `src/app/(dashboard)/dashboard/appearance/page.tsx`
- Halaman pengaturan khusus tampilan toko publik (Warna tema, Teks Hero, dll).
- (Perlu alter table `stores` untuk menambahkan kolom `theme_settings` tipe JSONB, atau kita gunakan file konfigurasi sementara).

## Verification Plan
1. **Inventaris:** Mencoba mengedit stok langsung dari tabel dan memverifikasi perubahannya di database.
2. **Diskon:** Memasukkan diskon 20% pada produk seharga Rp 100.000, memverifikasi harga akhirnya menjadi Rp 80.000 di toko publik.
3. **Animasi & Gambar:** Membuka halaman publik, memverifikasi efek *fade-in* bekerja dan gambar produk yang diunggah muncul (bukan *placeholder*).
4. **CMS:** Mengubah warna tema toko dari dashboard dan melihat perubahannya langsung teraplikasikan di toko publik.
