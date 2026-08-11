# OutfitPOS Pro v3 — Personal Retail Edition

Versi ini dibuat ulang agar lebih profesional dan nyaman dipakai dari HP.

## Fitur utama
- Dashboard profesional
- Kasir / POS
- Produk & stok
- Tambah, edit, hapus produk
- SKU, kategori, varian, warna, supplier
- Stok minimum + peringatan restock
- Riwayat transaksi
- Detail transaksi + cetak struk
- Batalkan transaksi + stok otomatis kembali
- Metode pembayaran Tunai, QRIS, Transfer, Debit, Kredit
- Diskon transaksi
- Laporan harian
- Laporan mingguan
- Laporan bulanan
- Laporan tahunan
- Laporan seluruh data
- Omzet, transaksi, unit, laba kotor, rata-rata transaksi
- Analisis metode pembayaran
- Produk terlaris
- Penjualan per kategori
- Pencatatan pengeluaran operasional
- Backup JSON
- Restore JSON
- Export CSV
- PWA/offline cache
- Responsive untuk HP dan desktop
- Tidak ada produk demo pada katalog baru

## Login awal
Username: `admin`
Password: `admin123`

## Data lama
Versi ini otomatis mencoba memindahkan data dari OutfitPOS Pro v2 (`outfitpos_pro_v2`) ke versi 3. Jika data lama ada, produk dan transaksi akan dipertahankan.

## Penting
Data disimpan di localStorage browser. Untuk toko pribadi satu perangkat ini praktis. Jika nanti ingin dipakai beberapa HP/kasir secara bersamaan, tahap berikutnya adalah database online + login kasir + sinkronisasi real-time.


## v4 — Secure First-Run Login
- Tidak ada username/password demo yang ditampilkan atau diisi otomatis.
- Instalasi pertama akan menampilkan wizard pembuatan akun pemilik.
- Setelah akun dibuat, aplikasi kembali menggunakan login normal.
- Username dan password tidak disimpan di HTML; data akun disimpan di localStorage perangkat.
- Ada tombol tampil/sembunyikan password.
- Profil toko dapat diisi saat setup pertama.
- Jika Anda membawa backup/migrasi lama yang memiliki akun, aplikasi akan langsung menampilkan halaman login.
