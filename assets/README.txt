CARA ISI KONTEN
================

1. MUSIK
   - File musik sudah ada di: assets/music.mp3
   - Mau ganti? tinggal timpa file assets/music.mp3 dengan mp3 lain (nama file harus tetap music.mp3)
   - Musik mulai diputar begitu tombol intro "Buka Kejutannya" diklik (bukan autoplay
     langsung saat halaman dibuka).

2. PRECIOUS MEMORIES FOR ME (sekarang jadi HALAMAN TERPISAH: precious.html)
   - Tombol "precious memories for me" muncul di halaman utama SETELAH lilin ditiup
     (bareng amplop surat & pesan ulang tahun)
   - Diklik → pindah ke halaman precious.html (URL beneran, bukan modal/popup)
   - Halaman ini punya 2 tahap:
       TAHAP 1 — partikel emas kecil membentuk TEKS custom (efek canvas particle-text)
       TAHAP 2 — disentuh/diklik → partikel "meledak" lalu muncul galeri foto masonry
   - GANTI TEKS PARTIKEL: buka precious-script.js, cari baris paling atas:
       const PARTICLE_TEXT = ['PRECIOUS', 'MEMORIES'];
     Ganti isinya sesuai kata yang kamu mau (tiap elemen array = satu baris teks).
     Contoh: const PARTICLE_TEXT = ['UNTUK', 'GAISHA'];
   - GANTI FOTO GALERI: masih di precious-script.js, cari GALLERY_ITEMS, isinya:
       assets/photos/foto1.jpg
       assets/photos/foto2.jpg
       assets/photos/foto3.jpg
       assets/photos/video1.mp4
     Tinggal drop file baru ke assets/photos/ lalu update path src di array-nya.
     type: 'image' atau 'video', caption: teks kecil muncul saat di-hover (boleh kosong '')

3. QR CODE
   - Sudah dihapus dari web sesuai permintaan. Tidak ada lagi section QR di halaman.

4. AMPLOP SURAT (muncul otomatis SETELAH lilin ditiup, bareng pesan ulang tahun)
   - Buka file index.html, cari bagian: <div class="letter-card-body" id="letterCardBody">
   - Ganti teks "Tulis suratmu di sini..." dengan isi surat yang kamu mau
   - Boleh multi-baris/paragraf — enter biasa di HTML sudah otomatis kebaca sebagai baris baru
   - Mau ganti "Untuk Gaisha" di judul kartu surat atau "Dengan sayang, —" di penutup?
     tinggal edit langsung teks di dalam <p class="letter-card-heading"> dan
     <p class="letter-card-signoff"> di file yang sama
   - Cara pakai: setelah lilin ditiup, amplop akan muncul di bawah pesan ulang tahun.
     Diketuk sekali → flap amplop kebuka + surat naik keluar sedikit → lalu muncul
     kartu berisi surat lengkap

5. GITHUB PAGES
   - Push semua file ke repo GitHub
   - Settings → Pages → Deploy from branch: main
   - URL biasanya: https://username.github.io/nama-repo