# 💊 Warfarin Dose Planner

คำนวณขนาดยา Warfarin อัตโนมัติ • กระจาย dose สม่ำเสมอ • นับเม็ดยา

## ✨ Features

- เลือกเม็ดยาที่มีในโรงพยาบาล (1-5 mg) พร้อมสีตรงตามจริง
- คำนวณแผนจัดยาที่กระจาย dose สม่ำเสมอที่สุด
- แสดงรูปเม็ดยาสีจริง (ขาว/ส้ม/ฟ้า/เหลือง/ชมพู)
- นับเม็ดยาสำหรับนัดครั้งหน้า
- ปรับเร็วทั้ง mg และ % ตามเม็ดยาที่มี

---

## 🚀 วิธี Deploy

### วิธีที่ 1: Vercel (แนะนำ — ง่ายที่สุด)

```bash
# 1. Push ขึ้น GitHub
git init
git add .
git commit -m "Warfarin Calculator"
git remote add origin https://github.com/YOUR_USERNAME/warfarin-calculator.git
git push -u origin main

# 2. ไปที่ vercel.com → New Project → Import จาก GitHub
# 3. กด Deploy — เสร็จ! ✅
```

> ไม่ต้องตั้งค่าอะไรเลย Vercel detect Vite อัตโนมัติ

---

### วิธีที่ 2: Netlify

```bash
# 1. Push ขึ้น GitHub (เหมือนด้านบน)

# 2. ไปที่ app.netlify.com → Add new site → Import from Git
# 3. เลือก repo → Netlify จะอ่าน netlify.toml อัตโนมัติ
# 4. กด Deploy — เสร็จ! ✅
```

> มี `netlify.toml` ในโปรเจคแล้ว ไม่ต้องตั้งค่าเพิ่ม

---

### วิธีที่ 3: GitHub Pages (ฟรี 100%)

**ขั้นตอนที่ 1: แก้ `vite.config.js`**

```js
export default defineConfig({
  plugins: [react()],
  base: '/warfarin-calculator/',  // ← เปลี่ยนเป็นชื่อ repo
})
```

**ขั้นตอนที่ 2: Push ขึ้น GitHub**

```bash
git init
git add .
git commit -m "Warfarin Calculator"
git remote add origin https://github.com/YOUR_USERNAME/warfarin-calculator.git
git push -u origin main
```

**ขั้นตอนที่ 3: เปิด GitHub Pages**

1. ไปที่ repo → **Settings** → **Pages**
2. Source: เลือก **GitHub Actions**
3. GitHub Actions จะ build & deploy อัตโนมัติ (มี workflow ให้แล้ว)
4. รอ 1-2 นาที → เว็บจะอยู่ที่ `https://YOUR_USERNAME.github.io/warfarin-calculator/`

---

## 🛠 Development

```bash
npm install        # ติดตั้ง dependencies
npm run dev        # เปิด dev server (http://localhost:5173)
npm run build      # Build สำหรับ production
npm run preview    # Preview build ก่อน deploy
```

---

## ⚠️ หมายเหตุ

โปรแกรมนี้เป็นเครื่องมือช่วยคำนวณเท่านั้น การปรับยา warfarin ต้องอยู่ภายใต้ดุลยพินิจของแพทย์
ร่วมกับผล INR และปัจจัยทางคลินิกอื่นๆ
