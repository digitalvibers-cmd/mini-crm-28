# Mini CRM - Zahtevi Proizvoda

## Pregled

Mini CRM je software koji pomaže malim kuhinjama za pripremu i dostavu zdravih obroka da lakše i bolje organizuju svoj posao. Mini CRM treba da pomogne u organizaciji, planiranju i praćenju sledećih oblasti poslovanja:

- 📦 Porudžbine
- 👥 Klijenti
- 🚚 Dostava
- 📋 Kreiranje nedeljnih jelovnika
- 📊 Planiranje i praćenje zaliha (normativi za svaki obrok)
- 🛒 Nabavka
- 📈 Analitika

---

## Modul: Porudžbine

### Funkcionalnosti

1. **Prikaz liste svih porudžbina**
   - Izvor podataka: WooCommerce API
   - Prikazuje sve porudžbine sa sajta

2. **Manuелno kreiranje porudžbine**
   - Mogućnost kreiranje nove porudžbine direktno u CRM-u
   - Relacija sa modulom Klijenti (izbor postojećeg klijenta)
   - Opcija kreiranja novog klijenta direktno iz forme za porudžbinu

3. **Vizuelna distinkcija**
   - Ručno kreirane porudžbine treba jasno da se razlikuju (drugačija boja ID polja)

### Podaci u tabeli

| Polje | Opis |
|-------|------|
| ID Porudžbine | Jedinstveni identifikator (drugačija boja ako je ručno kreirana) |
| Ime i Prezime | Ime kupca |
| Naziv Proizvoda | Paket/proizvod koji je naručen |
| Početak Programa | Datum početka dostave |
| Trajanje Programa | Broj dana trajanja |
| Adresa | Adresa dostave |

---

## Modul: Klijenti

### Funkcionalnosti

1. **Prikaz liste klijenata**
   - Izvor: WooCommerce API
   - Prikazuje sve klijente sa sajta

2. **CRUD Operacije**
   - ✅ Kreiranje (manuелno dodavanje novog klijenta)
   - ✅ Čitanje (pregled liste i detalja)
   - ✅ Izmena (ažuriranje podataka klijenta)
   - ✅ Brisanje (uklanjanje klijenta)

3. **Detaljna stranica klijenta**
   - Istorija porudžbina povezanih sa klijentom
   - Svi relevantni podaci o klijentu

---

## Modul: Dostava

### Funkcionalnosti

1. **Dnevni pregled dostava**
   - Dostavljač bira datum
   - Prikazuju se sve aktivne dostave za taj dan
   - Kalkulacija na osnovu `početak programa` + `trajanje programa`

2. **Detalji dostave**
   - ✅ Adrese za dostavu
   - ✅ Napomene za svaku adresu
   - ✅ Ukupan broj dostava za selektovani dan

3. **Rutiranje**
   - ✅ Optimizacija rute (OSRM integracija)
   - ✅ Vizualizacija na mapi

---

## Modul: Jelovnici

### Funkcionalnosti

1. **Kreiranje jela**
   - Kuvar kreira individualna jela
   - Kategorije:
     - 🌅 Doručak
     - 🍽️ Ručak
     - 🌙 Večera
     - 🍎 Užina

2. **Normativi i namirnice**
   - Za svako jelo se definišu namirnice
   - Količine (normativi) za svaku namirnicu
   - Baza podataka namirnica

### Podmodul: Nedeljni Jelovnik

1. **Kreiranje nedeljnog jelovnika**
   - Kuvar sastavlja jelovnik za celu nedelju
   - Bira jela iz prethodno kreiranih jela
   - Organizovano po danima i obrocima

2. **Pregled prethodnih jelovnika**
   - Istorija nedeljnih jelovnika
   - Mogućnost kopiranja/ponavljanja uspešnih jelovnika

---

## Modul: Nabavka

### Funkcionalnosti

1. **Automatski proračun potrebnih sirovina**
   - Na osnovu nedeljnog jelovnika
   - Agregacija svih namirnica iz svih jela u jelovniku
   - Kalkulacija količina na osnovu normativa

2. **Lista za nabavku**
   - ✅ Prikazuje sve potrebne sirovine
   - ✅ Količine za nabavku
   - ✅ Mogućnost export-a (WhatsApp format)

3. **Dobavljači**
   - Organizacija namirnica po dobavljačima
   - Olakšan proces naručivanja

---

## Modul: Analitika

### Funkcionalnosti

1. **Pregled ključnih metrika**
   - Ukupan broj kupaca
   - Ukupan broj porudžbina
   - Broj aktivnih porudžbina

2. **Grafici i trendovi**
   - ✅ Trend porudžbina (nedeljni/mesečni)
   - ✅ Projekcija dostava (14 dana unapred)
   - Najpopularnija jela
   - Revenue analytics

3. **Mapa gustine dostave**
   - ✅ Vizualizacija zona sa najviše dostava
   - Pomoć u optimizaciji logistike

---

## Tehnički Zahtevi

### Integracije

- **WooCommerce API**: Source of truth za porudžbine i klijente
- **Supabase**: Backend i baza podataka (planirano za kraj)
- **Vercel**: Deployment (planirano za kraj)

### Postojeća Infrastruktura

- **Next.js 16** (Turbopack)
- **Tailwind CSS**
- **TypeScript**
- **Recharts** (grafici)
- **Leaflet** (mape)
- **OSRM** (rutiranje)

---

## Prioriteti

### Faza 1 (Implementirano) ✅
- Dashboard sa osnovnim metrikama
- WooCommerce integracija
- Modul Porudžbine (read-only)
- Modul Dostava (pregled, rutiranje)
- Modul Nabavka (manuelna lista)

### Faza 2 (U Toku) 🔄
- Kompletna CRUD funkcionalnost za Porudžbine
- Modul Klijenti (CRUD)

### Faza 3 (Planirano) 📋
- Modul Jelovnici
- Podmodul Nedeljni Jelovnik
- Automatska kalkulacija za Nabavku na osnovu jelovnika

### Faza 4 (Backend & Deploy) 🚀
- Supabase integracija
- Vercel deployment
- Production optimizacije
