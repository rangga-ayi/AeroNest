# CONTEXT.md — AeroNest (IoT Monitoring Suhu, Kelembapan & Tekanan Udara)

## Tentang Proyek

**AeroNest** adalah sistem monitoring iklim mikro ruangan berbasis **ESP8266 (Wemos D1 Mini)** dengan sensor **AHT20** (suhu & kelembapan) dan **BMP280** (tekanan udara). Perangkat mengirim data ke **Firebase Realtime Database** tiap 5 menit (mode deep sleep), lalu data ditampilkan di **dashboard web modern (React + Three.js 3D Digital Twin)** di GitHub Pages dan dianalisis otomatis oleh **AI lokal (Ollama)**.

Alur data: `Firmware ESP8266 → Firebase RTDB (/RIWAYAT_LAB) → Dashboard Web (2D & 3D Digital Twin)` dan `Firebase → analisa_lab.py → Ollama → Laporan (/LAPORAN_AI) → Dashboard`.

## Arsitektur & Komponen

### 1. Firmware ESP8266 — `Wemos_BMP280_ATH20_Firebase/`
- Skema: `Wemos_BMP280_ATH20_Firebase.ino` (logika) + `secrets.h` (kredensial, gitignored; template: `secrets_contoh.h`).
- Siklus hidup: bangun → baca baterai (A0, 32 sampel median) → cek proteksi daya → baca sensor I2C → konek WiFi (fallback 5 SSID) → push JSON ke `/RIWAYAT_LAB` → deep sleep 5 menit.
- **Proteksi baterai:** tegangan < 3.4V → hibernasi 1 jam; < 3.6V ditandai `status_daya = "rendah"`.
- Kalibrasi: elevasi 8 m, offset tekanan 1.53 hPa, multiplier baterai 0.004038.
- Retry push 3× dengan backoff linier; field diagnostik: `status_daya`, `rssi`, `durasi_bangun_ms`, `adc_raw`, `status_sensor`.
- `DEBUG_MODE` untuk pengujian di meja (push tiap 10 detik, tanpa deep sleep).

### 2. Dashboard Web — `src/` & `index.html` (Vite + React) / `index_legacy.html` (Legacy v1)
- Modern stack: React 18, TypeScript, Tailwind CSS, Lucide icons, Chart.js (`react-chartjs-2`), Firebase JS SDK.
- Tiga gauge realtime (suhu, kelembapan, tekanan) dengan ambang kenyamanan, grafik riwayat multi-axis, tabel log dengan sortir/paginasi.
- Mode tampilan: Live (30 data terakhir), custom jumlah, rentang tanggal; ekspor CSV.
- Persentase baterai dihitung dari **kurva discharge Li-ion** (bukan linear).
- Banner peringatan baterai kritis; deteksi offline bila > 7 menit tanpa data.
- Modal AI Insight membaca `LAPORAN_AI` dan me-render markdown tersanitasi via DOMPurify.

### 3. 3D Digital Twin Diorama — `src/components/3d/`
- **Arsitektur Pemodelan Prosedural Three.js:** Seluruh model hardware dan ruangan dibangun secara prosedural murni menggunakan primitif Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`), **tanpa bergantung pada file aset eksternal (`.gltf` / `.glb`)**. Hal ini menjamin waktu muat instan tanpa latensi download model, 0% risiko kegagalan aset (404/CORS) di GitHub Pages, ukuran bundle minimal, serta kontrol dinamis penuh terhadap warna material, emissive pulse, dan geometri berdasarkan data telemetri real-time.
- **Komponen Hardware Digital Twin (`src/components/3d/hardware/`):**
  - `WemosD1Mini3D.tsx`: Model prosedural board Wemos D1 Mini ESP8266 (PCB biru, pin headers, port Micro-USB, modul shield RF ESP-12F metalik, chip IC, dan LED transmisi data yang berkedip sesuai sinyal telemetri).
  - `BatteryPack186503D.tsx`: Baterai Li-ion 18650 dalam battery holder silinder dengan LED indikator level daya reaktif (hijau >3.6V, kuning 3.4–3.6V, merah <3.4V kritis) serta label status tegangan.
  - `SensorBreakout3D.tsx`: Dual modul sensor I2C AHT20 (suhu & kelembapan) dan BMP280 (tekanan atmosfer) dengan detail metal cap cavity, resistor SMD, dan pinout.
  - `DupontWiring3D.tsx`: Kabel jumper fleksibel berbasis `CatmullRomCurve3` dengan kode warna standar (VCC merah, GND hitam, SDA biru, SCL kuning, A0/pembagi tegangan ungu) yang menghubungkan sensor dan baterai ke board ESP8266.
- **Lingkungan & Aksesori Meja Kerja (`src/components/3d/environment/`):**
  - `LabDioramaRoom3D.tsx`: Ruangan lab isometrik cutaway dengan ubin lantai, dinding bertekstur, jendela dengan pencahayaan lingkungan luar, dan meja kerja kayu.
  - `LabStationAccessories3D.tsx`: Aksesori meja lab (multimeter digital, solder stasiun, dan notebook catatan eksperimen) untuk skala visual realistis.
- **Efek Telemetri & Partikel Atmosfer (`src/components/3d/effects/`):**
  - `TelemetryAtmosphere3D.tsx`: Simulasi partikel mikro atmosfer dinamis yang bereaksi langsung terhadap data telemetri: kecepatan dan warna partikel bergeser menurut suhu, densitas kabut kondensasi menurut kelembapan, dan kepadatan partikel melayang menurut tekanan udara.
  - `SignalWave3D.tsx`: Animasi gelombang radio konsentris terpancar dari antena Wemos saat transmisi data aktif.
- **Kanvas Interaktif & Fallback (`src/components/3d/LabCanvas3D.tsx`):**
  - R3F Canvas dengan `OrbitControls`, batas rotasi/zoom ergonomis, preset view kamera (Default 3D, Close-up MCU, Top-down Schematic, Atmospheric Stage), `WebGLFallbackCard` berbasis CSS untuk perangkat tanpa akselerasi grafis, serta dukungan `prefers-reduced-motion`.

### 4. Analisis AI — `analisa_lab.py` (template: `analisa_lab_contoh.py`)
- Menarik 7 hari data dari `/RIWAYAT_LAB`, menghitung statistik pandas, lalu menggabungkan data cuaca luar (OpenWeatherMap, sunrise-sunset, AQI WAQI).
- Menyusun prompt berbahasa Indonesia → Ollama lokal (127.0.0.1:11434) dengan fallback berurutan di `DAFTAR_MODEL_AI`.
- Output: file `Laporan_AI_*.txt` + upload ke `/LAPORAN_AI` (`timestamp` + `laporan_text`).

### 5. Pemeliharaan Database — `maintenance_db.py` (template: `maintenance_db_contoh.py`)
- Backup penuh ke `Backup_Firebase_*.json`, identifikasi data error/usang, hapus batch (500 record/request) setelah konfirmasi.
- Retensi 6 bulan; record tanpa `timestamp` tidak dihapus otomatis (perlu review manual).

## Glosarium Istilah Kunci

| Istilah | Arti |
| :--- | :--- |
| `RIWAYAT_LAB` | Node Firebase berisi riwayat telemetri perangkat (push key Firebase). |
| `LAPORAN_AI` | Node Firebase berisi laporan AI terbaru (`timestamp`, `laporan_text`). |
| `suhu` / `kelembapan` / `tekanan` | Nilai sensor: suhu (°C), kelembapan relatif (% RH), tekanan (hPa, sudah dikonversi MSLP). |
| `tegangan_vcc` | Tegangan baterai (V). Sentinel `0.0` / `< 0.5` = gagal baca ADC, bukan bacaan nyata. |
| `koneksi` | SSID WiFi yang sedang dipakai perangkat. |
| `status_daya` | Status baterai dari firmware: `normal` / `rendah` / `kritis`. |
| MSLP | Tekanan permukaan laut — konversi dari tekanan absolut berdasarkan elevasi lokasi. |
| `RENTANG_WAJAR` | Rentang nilai fisik sensor (`suhu` -10..60, `kelembapan` 1..100, `tekanan` 950..1050) — harus konsisten di firmware, `analisa_lab.py`, dan `maintenance_db.py`. |
| Deep sleep | Mode hemat daya ESP8266; perangkat tidur 5 menit dan bangun 2–3 detik. |
| Hibernasi | Mode tidur panjang (1 jam) saat baterai kritis (< 3.4V). |

## Konvensi & Keputusan Penting

- **Pola template + file real:** file `*_contoh.*` di-commit sebagai template; versi real berisi kredensial dan di-`.gitignore` (`secrets.h`, `analisa_lab.py`, `maintenance_db.py`, service account JSON, `*.json` selain template).
- **Satu sumber ambang kenyamanan:** ambang suhu `[24, 29, 33]` dan kelembapan `[40, 65, 80]` didefinisikan di `AMBANG` pada dashboard.
- **Validasi fisik sebelum statistik:** outlier di luar `RENTANG_WAJAR` dan sentinel tegangan 0.0V dibuang sebelum perhitungan apa pun, di semua lapisan.
- **Push key Firebase tidak dijamin kronologis** (ESP8266 kehilangan jam saat deep sleep) — data selalu diurutkan eksplisit berdasarkan `timestamp`.

## Keamanan (Catatan)

- API key OpenWeatherMap & token WAQI saat ini tertulis plaintext di `analisa_lab.py` (gitignored, tetapi sebaiknya dipindah ke environment variable).
- File service account Firebase (`rangga-iot-firebase-adminsdk-*.json`) ada di root proyek — jangan pernah di-commit atau dibagikan.