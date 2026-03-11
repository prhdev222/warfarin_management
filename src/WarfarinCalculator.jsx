import { useState, useMemo, useCallback } from "react";

const DAYS_TH = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];
const DAYS_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const ALL_TABLETS = [1, 2, 3, 4, 5];

/* ═══════════════════════════════════════════════════════
   WARFARIN DRUG INTERACTION DATABASE
   effect: "increase" = เพิ่ม INR (ต้องลดยา warfarin)
           "decrease" = ลด INR (ต้องเพิ่มยา warfarin)
           "bleeding" = เพิ่มความเสี่ยงเลือดออก (ไม่เปลี่ยน INR แต่อันตราย)
   severity: "severe" | "moderate" | "mild"
   adjust: คำแนะนำการปรับยา
   mechanism: กลไก
   ═══════════════════════════════════════════════════════ */
const DRUG_INTERACTIONS = [
  // ──── SEVERE INCREASE INR (ต้องลด warfarin) ────
  { generic: "Amiodarone", brand: "Cordarone", thaiName: "อะมิโอดาโรน", category: "Antiarrhythmic", effect: "increase", severity: "severe", adjust: "ลด warfarin 30-50%", mechanism: "ยับยั้ง CYP2C9, 3A4, 1A2", onset: "ช้า (1-6 สัปดาห์) ออกฤทธิ์นาน", note: "FAB-4: ยาที่ต้องระวังมากที่สุด, half-life ยาว interaction อยู่นานแม้หยุดยา" },
  { generic: "Fluconazole", brand: "Diflucan", thaiName: "ฟลูโคนาโซล", category: "Antifungal", effect: "increase", severity: "severe", adjust: "ลด warfarin 25-50%", mechanism: "ยับยั้ง CYP2C9, 3A4 อย่างแรง", onset: "เร็ว (2-3 วัน)", note: "FAB-4: แม้ dose เดียวก็เพิ่ม INR ได้" },
  { generic: "Voriconazole", brand: "Vfend", thaiName: "โวริโคนาโซล", category: "Antifungal", effect: "increase", severity: "severe", adjust: "ลด warfarin 30-50%", mechanism: "ยับยั้ง CYP2C9, 2C19, 3A4", onset: "เร็ว (2-3 วัน)", note: "แรงกว่า fluconazole" },
  { generic: "Itraconazole", brand: "Sporanox", thaiName: "อิทราโคนาโซล", category: "Antifungal", effect: "increase", severity: "severe", adjust: "ลด warfarin 20-30%", mechanism: "ยับยั้ง CYP3A4", onset: "3-7 วัน", note: "" },
  { generic: "Ketoconazole", brand: "Nizoral", thaiName: "คีโตโคนาโซล", category: "Antifungal", effect: "increase", severity: "severe", adjust: "ลด warfarin 20-30%", mechanism: "ยับยั้ง CYP3A4", onset: "3-7 วัน", note: "" },
  { generic: "Sulfamethoxazole/TMP", brand: "Bactrim, Septrin", thaiName: "โคไตรมอกซาโซล", category: "Antibiotic", effect: "increase", severity: "severe", adjust: "ลด warfarin 25-50%", mechanism: "ยับยั้ง CYP2C9 + แย่ง protein binding", onset: "เร็ว (3-5 วัน)", note: "FAB-4: พบบ่อยมากในเวชปฏิบัติ" },
  { generic: "Metronidazole", brand: "Flagyl", thaiName: "เมโทรนิดาโซล", category: "Antibiotic", effect: "increase", severity: "severe", adjust: "ลด warfarin 25-35%", mechanism: "ยับยั้ง CYP2C9", onset: "3-5 วัน", note: "FAB-4: ทั้งยากินและทายาช่องคลอด" },
  { generic: "Acetaminophen", brand: "Tylenol, Sara", thaiName: "พาราเซตามอล", category: "Analgesic", effect: "increase", severity: "severe", adjust: "จำกัด <2g/วัน, ติดตาม INR ถ้าใช้ >3 วัน", mechanism: "ยับยั้ง VKOR (วิตามิน K epoxide reductase)", onset: "3-5 วัน (ถ้าใช้ต่อเนื่อง)", note: "ปลอดภัยที่ขนาดต่ำ แต่ขนาดสูงต่อเนื่องเพิ่ม INR" },
  { generic: "Tamoxifen", brand: "Nolvadex", thaiName: "ทาม็อกซิเฟน", category: "Antineoplastic", effect: "increase", severity: "severe", adjust: "ลด warfarin 30-50%", mechanism: "ยับยั้ง CYP2C9, 3A4", onset: "1-2 สัปดาห์", note: "เพิ่มเสี่ยงเลือดออกด้วย" },

  // ──── MODERATE INCREASE INR ────
  { generic: "Ciprofloxacin", brand: "Cipro, Ciproxin", thaiName: "ซิโปรฟลอกซาซิน", category: "Antibiotic (FQ)", effect: "increase", severity: "moderate", adjust: "ลด warfarin 10-20%, ตรวจ INR ใน 3-5 วัน", mechanism: "ยับยั้ง CYP1A2 + ลดแบคทีเรียสร้างวิตามิน K", onset: "3-7 วัน", note: "" },
  { generic: "Levofloxacin", brand: "Levaquin, Cravit", thaiName: "ลีโวฟลอกซาซิน", category: "Antibiotic (FQ)", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 3-5 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K", onset: "3-7 วัน", note: "น้อยกว่า ciprofloxacin" },
  { generic: "Norfloxacin", brand: "Noroxin", thaiName: "นอร์ฟลอกซาซิน", category: "Antibiotic (FQ)", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 3-5 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K", onset: "3-7 วัน", note: "" },
  { generic: "Azithromycin", brand: "Zithromax", thaiName: "อะซิโทรมัยซิน", category: "Antibiotic (Macrolide)", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 5-7 วัน", mechanism: "ยับยั้ง CYP3A4 เล็กน้อย + ลดแบคทีเรีย vit K", onset: "5-7 วัน", note: "" },
  { generic: "Clarithromycin", brand: "Biaxin, Klacid", thaiName: "คลาริโทรมัยซิน", category: "Antibiotic (Macrolide)", effect: "increase", severity: "moderate", adjust: "ลด warfarin 10-20%", mechanism: "ยับยั้ง CYP3A4", onset: "3-7 วัน", note: "" },
  { generic: "Erythromycin", brand: "Erythrocin", thaiName: "อีริโทรมัยซิน", category: "Antibiotic (Macrolide)", effect: "increase", severity: "moderate", adjust: "ลด warfarin 10-20%", mechanism: "ยับยั้ง CYP3A4", onset: "3-7 วัน", note: "" },
  { generic: "Cephalosporins", brand: "Ceftriaxone, Cefazolin", thaiName: "เซฟาโลสปอริน", category: "Antibiotic", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ถ้าใช้ >3 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K + ยับยั้ง vit K recycling (MTT side chain)", onset: "5-7 วัน", note: "Cefoperazone, Cefotetan มี MTT side chain เพิ่ม INR มากกว่า" },
  { generic: "Doxycycline", brand: "Vibramycin", thaiName: "ดอกซีไซคลิน", category: "Antibiotic", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 5-7 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K", onset: "5-7 วัน", note: "" },
  { generic: "Amoxicillin", brand: "Amoxil", thaiName: "อะม็อกซีซิลลิน", category: "Antibiotic", effect: "increase", severity: "mild", adjust: "ตรวจ INR ถ้าใช้ >7 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K", onset: "7-14 วัน", note: "Interaction น้อย แต่ยังควรติดตาม" },
  { generic: "Amoxicillin/Clavulanate", brand: "Augmentin", thaiName: "อะม็อกซีซิลลิน/คลาวูลาเนต", category: "Antibiotic", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 5-7 วัน", mechanism: "ลดแบคทีเรียสร้างวิตามิน K", onset: "5-7 วัน", note: "" },
  { generic: "Omeprazole", brand: "Losec, Miracid", thaiName: "โอเมพราโซล", category: "PPI", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP2C19", onset: "1-2 สัปดาห์", note: "Pantoprazole / Rabeprazole interact น้อยกว่า" },
  { generic: "Esomeprazole", brand: "Nexium", thaiName: "เอโซเมพราโซล", category: "PPI", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP2C19 เล็กน้อย", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Cimetidine", brand: "Tagamet", thaiName: "ซิเมทิดีน", category: "H2 blocker", effect: "increase", severity: "moderate", adjust: "ลด warfarin 10-20%", mechanism: "ยับยั้ง CYP1A2, 2C9, 3A4", onset: "3-7 วัน", note: "Ranitidine / Famotidine ไม่ interact" },
  { generic: "Simvastatin", brand: "Zocor", thaiName: "ซิมวาสแตติน", category: "Statin", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP3A4", onset: "1-2 สัปดาห์", note: "Pravastatin, Rosuvastatin interact น้อยที่สุด" },
  { generic: "Atorvastatin", brand: "Lipitor", thaiName: "อะทอร์วาสแตติน", category: "Statin", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 2 สัปดาห์", mechanism: "ยับยั้ง CYP3A4 เล็กน้อย", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Fluvastatin", brand: "Lescol", thaiName: "ฟลูวาสแตติน", category: "Statin", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP2C9", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Fenofibrate", brand: "Tricor, Lipanthyl", thaiName: "ฟีโนไฟเบรต", category: "Fibrate", effect: "increase", severity: "moderate", adjust: "ลด warfarin 10-30%", mechanism: "ยับยั้ง CYP2C9 + แย่ง protein binding", onset: "3-7 วัน", note: "" },
  { generic: "Gemfibrozil", brand: "Lopid", thaiName: "เจมไฟโบรซิล", category: "Fibrate", effect: "increase", severity: "moderate", adjust: "ลด warfarin 20-30%", mechanism: "ยับยั้ง CYP2C9", onset: "3-7 วัน", note: "" },
  { generic: "Allopurinol", brand: "Zyloprim", thaiName: "อัลโลพิวรินอล", category: "Antigout", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง metabolism", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Propranolol", brand: "Inderal", thaiName: "โพรพราโนลอล", category: "Beta blocker", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP1A2", onset: "1-2 สัปดาห์", note: "Beta blocker อื่นมักไม่ interact" },
  { generic: "Amitriptyline", brand: "Elavil", thaiName: "อะมิทริปไทลีน", category: "TCA", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 2 สัปดาห์", mechanism: "ยับยั้ง CYP2C9 เล็กน้อย", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Levothyroxine", brand: "Synthroid, Eltroxin", thaiName: "ลีโวไทรอกซีน", category: "Thyroid", effect: "increase", severity: "moderate", adjust: "ตรวจ INR เมื่อเริ่ม/เปลี่ยน dose", mechanism: "เพิ่ม catabolism ของ clotting factors", onset: "1-4 สัปดาห์", note: "Hyperthyroidism เพิ่ม warfarin sensitivity" },
  { generic: "Diltiazem", brand: "Herbesser", thaiName: "ดิลไทอะเซม", category: "CCB", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP3A4", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Amlodipine", brand: "Norvasc", thaiName: "แอมโลดิปีน", category: "CCB", effect: "increase", severity: "mild", adjust: "ตรวจ INR ใน 2 สัปดาห์", mechanism: "แย่ง protein binding", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Isoniazid", brand: "INH", thaiName: "ไอโซไนอาซิด", category: "Anti-TB", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ยับยั้ง CYP2C9, 2C19", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Tramadol", brand: "Ultram, Tramol", thaiName: "ทรามาดอล", category: "Analgesic", effect: "increase", severity: "moderate", adjust: "ตรวจ INR ใน 3-7 วัน", mechanism: "ยับยั้ง CYP metabolism", onset: "3-7 วัน", note: "เพิ่มเสี่ยงเลือดออกด้วย" },

  // ──── SEVERE DECREASE INR (ต้องเพิ่ม warfarin) ────
  { generic: "Rifampin", brand: "Rifadin", thaiName: "ไรแฟมพิซิน", category: "Anti-TB", effect: "decrease", severity: "severe", adjust: "เพิ่ม warfarin 2-3 เท่า, ตรวจ INR บ่อยๆ", mechanism: "กระตุ้น CYP2C9, 3A4, 1A2 อย่างแรง (strongest inducer)", onset: "5-7 วัน, ออกฤทธิ์อยู่ 2-3 สัปดาห์หลังหยุด", note: "Drug interaction ที่แรงที่สุดของ warfarin, ต้องระวังมากทั้งเริ่มและหยุดยา" },
  { generic: "Carbamazepine", brand: "Tegretol", thaiName: "คาร์บามาซีพีน", category: "Anticonvulsant", effect: "decrease", severity: "severe", adjust: "เพิ่ม warfarin, ตรวจ INR ทุก 1-2 สัปดาห์", mechanism: "กระตุ้น CYP3A4, 2C9", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Phenytoin", brand: "Dilantin", thaiName: "ฟีนิโทอิน", category: "Anticonvulsant", effect: "decrease", severity: "severe", adjust: "เพิ่ม warfarin, ตรวจ INR บ่อย", mechanism: "กระตุ้น CYP2C9, 3A4", onset: "1-2 สัปดาห์", note: "ระยะแรกอาจเพิ่ม INR (แย่ง protein binding) ก่อนจะลด" },
  { generic: "Phenobarbital", brand: "Luminal", thaiName: "ฟีโนบาร์บิทาล", category: "Barbiturate", effect: "decrease", severity: "severe", adjust: "เพิ่ม warfarin, ตรวจ INR ทุก 1-2 สัปดาห์", mechanism: "กระตุ้น CYP1A2, 2C9, 3A4", onset: "1-2 สัปดาห์", note: "" },
  { generic: "St. John's Wort", brand: "St. John's Wort", thaiName: "เซนต์จอห์นเวิร์ท", category: "Supplement", effect: "decrease", severity: "severe", adjust: "หลีกเลี่ยง, เพิ่ม warfarin ถ้าจำเป็น", mechanism: "กระตุ้น CYP1A2, 2C9, 3A4", onset: "1-2 สัปดาห์", note: "สมุนไพรที่อันตรายที่สุดกับ warfarin" },

  // ──── MODERATE DECREASE INR ────
  { generic: "Cholestyramine", brand: "Questran", thaiName: "โคเลสไทรามีน", category: "Bile acid sequestrant", effect: "decrease", severity: "moderate", adjust: "ให้ warfarin ห่าง cholestyramine 2 ชม.", mechanism: "ลดการดูดซึม warfarin", onset: "ทันที (ถ้าทานพร้อมกัน)", note: "แยกเวลาทานให้ห่าง 2-4 ชม." },
  { generic: "Sucralfate", brand: "Carafate, Ulsanic", thaiName: "ซูคราลเฟต", category: "GI protectant", effect: "decrease", severity: "moderate", adjust: "แยกเวลาทาน 2 ชม.", mechanism: "ลดการดูดซึม warfarin", onset: "ทันที", note: "" },
  { generic: "Azathioprine", brand: "Imuran", thaiName: "อะซาไทโอพรีน", category: "Immunosuppressant", effect: "decrease", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "ไม่ทราบชัดเจน", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Griseofulvin", brand: "Grifulvin", thaiName: "กริซีโอฟูลวิน", category: "Antifungal", effect: "decrease", severity: "moderate", adjust: "ตรวจ INR ใน 1-2 สัปดาห์", mechanism: "กระตุ้น CYP metabolism", onset: "1-2 สัปดาห์", note: "" },

  // ──── VITAMIN K (food & supplement) ────
  { generic: "Vitamin K", brand: "Phytonadione", thaiName: "วิตามิน เค", category: "Vitamin", effect: "decrease", severity: "severe", adjust: "หลีกเลี่ยงอาหารเสริมวิตามิน K, ทานผักใบเขียวให้คงที่", mechanism: "ต้านฤทธิ์ warfarin โดยตรง", onset: "ทันที (24-48 ชม.)", note: "ผักใบเขียว: คะน้า บร็อคโคลี ผักโขม ผักบุ้ง — ทานได้แต่ให้คงที่" },
  { generic: "Coenzyme Q10", brand: "CoQ10", thaiName: "โคเอนไซม์คิวเทน", category: "Supplement", effect: "decrease", severity: "moderate", adjust: "ตรวจ INR ใน 2 สัปดาห์", mechanism: "โครงสร้างคล้ายวิตามิน K", onset: "1-2 สัปดาห์", note: "" },

  // ──── BLEEDING RISK (ไม่เปลี่ยน INR แต่เพิ่มเสี่ยงเลือดออก) ────
  { generic: "Aspirin", brand: "Aspirin", thaiName: "แอสไพริน", category: "Antiplatelet", effect: "bleeding", severity: "severe", adjust: "ถ้าจำเป็นใช้ low-dose (81mg), ตรวจ INR + เฝ้าระวังเลือดออก", mechanism: "ยับยั้ง COX-1 + ยับยั้งเกล็ดเลือด", onset: "ทันที", note: "ยาที่พบร่วมกับ warfarin บ่อยที่สุด, เพิ่มเสี่ยง GI bleeding มาก" },
  { generic: "Clopidogrel", brand: "Plavix", thaiName: "โคลพิโดเกรล", category: "Antiplatelet", effect: "bleeding", severity: "severe", adjust: "ใช้ได้ถ้ามี indication ชัดเจน, เฝ้าระวังเลือดออก", mechanism: "ยับยั้งเกล็ดเลือด + ยับยั้ง CYP2C9", onset: "ทันที", note: "Triple therapy (warfarin+ASA+clopi) เสี่ยงสูงมาก" },
  { generic: "Ticagrelor", brand: "Brilinta", thaiName: "ทิคากรีลอร์", category: "Antiplatelet", effect: "bleeding", severity: "severe", adjust: "เฝ้าระวังเลือดออกอย่างใกล้ชิด", mechanism: "ยับยั้งเกล็ดเลือด", onset: "ทันที", note: "" },
  { generic: "Ibuprofen", brand: "Brufen, Advil", thaiName: "ไอบูโพรเฟน", category: "NSAID", effect: "bleeding", severity: "severe", adjust: "หลีกเลี่ยง, ใช้ Paracetamol แทน", mechanism: "ยับยั้ง COX → ทำลายเกราะป้องกัน GI + ยับยั้งเกล็ดเลือด", onset: "ทันที", note: "NSAIDs ทุกตัวเพิ่มเสี่ยง GI bleeding กับ warfarin" },
  { generic: "Naproxen", brand: "Aleve, Naprosyn", thaiName: "นาพร็อกเซน", category: "NSAID", effect: "bleeding", severity: "severe", adjust: "หลีกเลี่ยง", mechanism: "ยับยั้ง COX + เกล็ดเลือด", onset: "ทันที", note: "" },
  { generic: "Diclofenac", brand: "Voltaren", thaiName: "ไดโคลฟีแนค", category: "NSAID", effect: "bleeding", severity: "severe", adjust: "หลีกเลี่ยง", mechanism: "ยับยั้ง COX + เกล็ดเลือด + ยับยั้ง CYP2C9", onset: "ทันที", note: "เพิ่ม INR ด้วยจาก CYP2C9 inhibition" },
  { generic: "Piroxicam", brand: "Feldene", thaiName: "ไพร็อกซิแคม", category: "NSAID", effect: "bleeding", severity: "severe", adjust: "หลีกเลี่ยง", mechanism: "ยับยั้ง COX + half-life ยาว", onset: "ทันที", note: "" },
  { generic: "Celecoxib", brand: "Celebrex", thaiName: "เซเลค็อกซิบ", category: "COX-2 inhibitor", effect: "bleeding", severity: "moderate", adjust: "ตรวจ INR + เฝ้าระวังเลือดออก", mechanism: "ยับยั้ง CYP2C9 + เล็กน้อยกว่า NSAIDs ทั่วไป", onset: "3-5 วัน", note: "ปลอดภัยกว่า NSAIDs อื่น แต่ยังเพิ่ม INR ได้" },
  { generic: "SSRIs (Fluoxetine etc.)", brand: "Prozac, Zoloft", thaiName: "SSRIs", category: "Antidepressant", effect: "bleeding", severity: "moderate", adjust: "เฝ้าระวังเลือดออก, ตรวจ INR", mechanism: "Serotonin มีบทบาทใน platelet aggregation + บาง SSRIs ยับยั้ง CYP2C9", onset: "1-2 สัปดาห์", note: "Fluoxetine, Fluvoxamine มีผลมากที่สุด (CYP inhibition ด้วย)" },
  { generic: "SNRIs (Venlafaxine etc.)", brand: "Effexor", thaiName: "SNRIs", category: "Antidepressant", effect: "bleeding", severity: "moderate", adjust: "เฝ้าระวังเลือดออก", mechanism: "ลด platelet serotonin", onset: "1-2 สัปดาห์", note: "" },
  { generic: "Ginkgo biloba", brand: "Ginkgo", thaiName: "แปะก๊วย", category: "Supplement", effect: "bleeding", severity: "moderate", adjust: "หลีกเลี่ยง", mechanism: "ยับยั้ง platelet activating factor", onset: "ไม่แน่นอน", note: "" },
  { generic: "Fish oil / Omega-3", brand: "Fish oil", thaiName: "น้ำมันปลา", category: "Supplement", effect: "bleeding", severity: "mild", adjust: "ขนาดสูง >3g/วัน ตรวจ INR", mechanism: "ลด platelet aggregation", onset: "1-2 สัปดาห์", note: "ขนาดปกติ (1g/วัน) มักปลอดภัย" },
  { generic: "Ginseng", brand: "Ginseng", thaiName: "โสม", category: "Supplement", effect: "bleeding", severity: "mild", adjust: "ตรวจ INR", mechanism: "ยับยั้งเกล็ดเลือด", onset: "ไม่แน่นอน", note: "บางรายงานว่าลด INR ด้วย — ผลไม่แน่นอน" },

  // ──── SAFE / MINIMAL INTERACTION ────
  { generic: "Pantoprazole", brand: "Protonix", thaiName: "แพนโทพราโซล", category: "PPI", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่มีผลต่อ CYP2C9", onset: "-", note: "PPI ที่ปลอดภัยที่สุดกับ warfarin" },
  { generic: "Rabeprazole", brand: "Pariet", thaiName: "ราเบพราโซล", category: "PPI", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่มีผลต่อ CYP2C9 อย่างมีนัยสำคัญ", onset: "-", note: "PPI ทางเลือกที่ปลอดภัย" },
  { generic: "Rosuvastatin", brand: "Crestor", thaiName: "โรสุวาสแตติน", category: "Statin", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่ผ่าน CYP450 เป็นหลัก", onset: "-", note: "Statin ที่ปลอดภัยที่สุดกับ warfarin" },
  { generic: "Pravastatin", brand: "Pravachol", thaiName: "พราวาสแตติน", category: "Statin", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่ผ่าน CYP450", onset: "-", note: "Statin ที่ปลอดภัยกับ warfarin" },
  { generic: "Ranitidine", brand: "Zantac", thaiName: "รานิทิดีน", category: "H2 blocker", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่ยับยั้ง CYP", onset: "-", note: "ปลอดภัยกว่า Cimetidine" },
  { generic: "Famotidine", brand: "Pepcid", thaiName: "ฟาโมทิดีน", category: "H2 blocker", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่ยับยั้ง CYP", onset: "-", note: "" },
  { generic: "Metformin", brand: "Glucophage", thaiName: "เมทฟอร์มิน", category: "Antidiabetic", effect: "none", severity: "none", adjust: "ไม่ต้องปรับ", mechanism: "ไม่ interact", onset: "-", note: "" },
];

/* ─── Find all achievable single-day doses from available tablets ─── */
function getAchievableDoses(tablets, maxMg = 20) {
  const doses = new Set([0]);
  const sorted = [...tablets].sort((a, b) => a - b);
  const units = [];
  sorted.forEach(t => { units.push(t); units.push(t / 2); });
  const uniqueUnits = [...new Set(units)].sort((a, b) => a - b);

  function dfs(idx, current) {
    const rounded = Math.round(current * 10) / 10;
    if (rounded <= maxMg) doses.add(rounded);
    if (current >= maxMg || idx >= uniqueUnits.length) return;
    for (let i = idx; i < uniqueUnits.length; i++) {
      const next = current + uniqueUnits[i];
      if (next > maxMg + 0.01) break;
      dfs(i, next);
    }
  }
  dfs(0, 0);
  return [...doses].sort((a, b) => a - b);
}

/* ─── Find tablet combination for a dose ─── */
function findTabletCombo(dose, tablets) {
  if (dose === 0) return { parts: [], possible: true };
  const sorted = [...tablets].sort((a, b) => b - a);

  let best = null;
  function search(rem, idx, curr) {
    if (Math.abs(rem) < 0.01) {
      const total = curr.reduce((s, c) => s + c.n, 0);
      if (!best || total < best.reduce((s, c) => s + c.n, 0)) best = [...curr];
      return;
    }
    if (rem < -0.01 || idx >= sorted.length) return;
    const t = sorted[idx];
    for (let n = Math.floor(rem / t + 0.01); n >= 0; n--) {
      curr.push({ mg: t, n, half: false });
      search(rem - t * n, idx + 1, curr);
      curr.pop();
    }
  }
  search(dose, 0, []);
  if (best) return { parts: best.filter(c => c.n > 0), possible: true };

  const units = [];
  sorted.forEach(t => {
    units.push({ mg: t, half: false, val: t });
    units.push({ mg: t, half: true, val: t / 2 });
  });
  units.sort((a, b) => b.val - a.val);
  const seen = new Set();
  const deduped = units.filter(u => {
    const k = `${u.mg}-${u.half}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  let bestH = null;
  function searchH(rem, idx, curr) {
    if (Math.abs(rem) < 0.01) {
      const total = curr.reduce((s, c) => s + c.n, 0);
      if (!bestH || total < bestH.reduce((s, c) => s + c.n, 0)) bestH = [...curr];
      return;
    }
    if (rem < -0.01 || idx >= deduped.length) return;
    const u = deduped[idx];
    for (let n = Math.min(Math.floor(rem / u.val + 0.01), 8); n >= 0; n--) {
      curr.push({ mg: u.mg, n, half: u.half });
      searchH(rem - u.val * n, idx + 1, curr);
      curr.pop();
    }
  }
  searchH(dose, 0, []);
  if (bestH) return { parts: bestH.filter(c => c.n > 0), possible: true, needsHalf: true };
  return { parts: [], possible: false };
}

/* ─── Distribute high/low doses evenly (Bresenham spacing) ─── */
function distributeEvenly(nHigh, doseHigh, doseLow) {
  if (nHigh === 0) return Array(7).fill(doseLow);
  if (nHigh === 7) return Array(7).fill(doseHigh);

  const schedule = Array(7).fill(doseLow);
  // Bresenham-like: place high doses as evenly spaced as possible
  // e.g. 3 high out of 7 → positions 0, 2, 5 (every ~2.33 days)
  for (let i = 0; i < nHigh; i++) {
    const pos = Math.floor((i * 7 + Math.floor(7 / 2)) / nHigh) % 7;
    schedule[pos] = doseHigh;
  }
  return schedule;
}

/* ─── Find all achievable weekly totals from available tablets ─── */
function getAchievableWeeklyTotals(tablets, maxWeekly = 105) {
  const daily = getAchievableDoses(tablets, 20);
  const totals = new Set();
  // Two-dose patterns: nH * dH + (7-nH) * dL
  for (let i = 0; i < daily.length; i++) {
    for (let j = i; j < daily.length; j++) {
      for (let nH = 0; nH <= 7; nH++) {
        const total = Math.round((nH * daily[j] + (7 - nH) * daily[i]) * 10) / 10;
        if (total >= 0 && total <= maxWeekly) totals.add(total);
      }
    }
  }
  return [...totals].sort((a, b) => a - b);
}

/* ─── Generate ranked schedule options ─── */
function generateOptions(weeklyTarget, tablets) {
  const achievable = getAchievableDoses(tablets, 20);
  const options = [];
  const seen = new Set();

  for (let i = 0; i < achievable.length; i++) {
    for (let j = i; j < achievable.length; j++) {
      const dL = achievable[i];
      const dH = achievable[j];

      if (dH === dL) {
        if (Math.abs(dH * 7 - weeklyTarget) < 0.01) {
          const key = `${dH}-${dL}-7`;
          if (!seen.has(key)) {
            seen.add(key);
            options.push({
              doseHigh: dH, doseLow: dL, nHigh: 7, nLow: 0,
              schedule: Array(7).fill(dH), variance: 0, gap: 0,
              label: `ทุกวัน ${dH} mg (สม่ำเสมอที่สุด)`,
            });
          }
        }
        continue;
      }

      const nH = (weeklyTarget - 7 * dL) / (dH - dL);
      if (nH < 0 || nH > 7 || Math.abs(nH - Math.round(nH)) > 0.01) continue;
      const nHi = Math.round(nH);
      const nLo = 7 - nHi;
      const key = `${dH}-${dL}-${nHi}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const schedule = distributeEvenly(nHi, dH, dL);
      const mean = weeklyTarget / 7;
      const variance = schedule.reduce((s, d) => s + (d - mean) ** 2, 0) / 7;
      const gap = Math.abs(dH - dL);

      options.push({
        doseHigh: dH, doseLow: dL, nHigh: nHi, nLow: nLo,
        schedule, variance, gap,
        label: nHi === 7 ? `ทุกวัน ${dH} mg` :
          `${dH} mg × ${nHi} วัน  /  ${dL} mg × ${nLo} วัน`,
      });
    }
  }

  // Enrich with metadata
  options.forEach(opt => {
    const combos = opt.schedule.map(d => findTabletCombo(d, tablets));
    opt.needsHalf = combos.some(c => c.needsHalf);
    const tabletMgs = new Set();
    combos.forEach(c => c.parts.forEach(p => tabletMgs.add(p.mg)));
    opt.numTabletTypes = tabletMgs.size;
    opt.isUniform = opt.gap === 0;
    opt.totalPillsPerWeek = combos.reduce((s, c) => s + c.parts.reduce((ss, p) => ss + p.n, 0), 0);
    // Pattern complexity: how many distinct daily doses
    const distinctDoses = new Set(opt.schedule);
    opt.numDistinctDoses = distinctDoses.size;
  });

  return options;
}

/* formatParts replaced by PillComboText and PillComboVisual components */

/* ─── Stars for evenness ─── */
function EvennessTag({ gap }) {
  if (gap === 0) return <span style={tagStyle("#4CAF50")}>★★★ สม่ำเสมอมาก</span>;
  if (gap <= 1) return <span style={tagStyle("#8BC34A")}>★★☆ ดีมาก</span>;
  if (gap <= 2) return <span style={tagStyle("#FFC107")}>★☆☆ พอใช้</span>;
  return <span style={tagStyle("#FF9800")}>☆☆☆ ต่างมาก</span>;
}
const tagStyle = (c) => ({
  display: "inline-block", padding: "2px 8px", borderRadius: 6,
  background: `${c}20`, color: c, fontSize: 10, fontWeight: 700,
  border: `1px solid ${c}40`,
});

/* ─── Main Component ─── */
export default function WarfarinCalculator() {
  const [tablets, setTablets] = useState([3, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(21);
  const [inputMode, setInputMode] = useState("weekly");
  const [dailyInput, setDailyInput] = useState(3);
  const [selIdx, setSelIdx] = useState(0);
  const [sortPref, setSortPref] = useState("even");
  const [appointDays, setAppointDays] = useState(14);
  const [tab, setTab] = useState("plan");
  const [navOpen, setNavOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [fontMode, setFontMode] = useState("normal"); // "normal" | "large" | "xlarge"
  const [drugSearch, setDrugSearch] = useState("");
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [currentINR, setCurrentINR] = useState("");
  const [indication, setIndication] = useState("standard");
  const [hasBleeding, setHasBleeding] = useState("none");
  const [preopRisk, setPreopRisk] = useState("low");
  const [bleedRisk, setBleedRisk] = useState("low_mod");

  const fontScale = fontMode === "normal" ? 1 : fontMode === "large" ? 1.18 : 1.3;

  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return [];
    const q = drugSearch.toLowerCase().trim();
    return DRUG_INTERACTIONS.filter(d =>
      d.generic.toLowerCase().includes(q) ||
      d.brand.toLowerCase().includes(q) ||
      d.thaiName.includes(q) ||
      d.category.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [drugSearch]);

  const toggleDrug = useCallback((drug) => {
    setSelectedDrugs(prev => {
      const exists = prev.find(d => d.generic === drug.generic);
      if (exists) return prev.filter(d => d.generic !== drug.generic);
      return [...prev, drug];
    });
  }, []);

  const toggleTab = (mg) => {
    setTablets(p => {
      if (p.includes(mg)) return p.length <= 1 ? p : p.filter(t => t !== mg);
      return [...p, mg].sort((a, b) => a - b);
    });
    setSelIdx(0);
  };

  const effWeekly = inputMode === "daily"
    ? Math.round(dailyInput * 7 * 10) / 10
    : weeklyTarget;

  const allOptions = useMemo(() => generateOptions(effWeekly, tablets), [effWeekly, tablets]);

  const options = useMemo(() => {
    const sorted = [...allOptions];
    switch (sortPref) {
      case "even": // ระดับยาใกล้เคียง
        sorted.sort((a, b) => {
          if (Math.abs(a.gap - b.gap) > 0.001) return a.gap - b.gap;
          return a.variance - b.variance;
        });
        break;
      case "nohalf": // ไม่ต้องหักครึ่ง
        sorted.sort((a, b) => {
          if (a.needsHalf !== b.needsHalf) return a.needsHalf ? 1 : -1;
          if (Math.abs(a.gap - b.gap) > 0.001) return a.gap - b.gap;
          return a.variance - b.variance;
        });
        break;
      case "single": // พกยาแบบเดียว → เรียง gap น้อยสุดเป็นรอง
        sorted.sort((a, b) => {
          if (a.numTabletTypes !== b.numTabletTypes) return a.numTabletTypes - b.numTabletTypes;
          if (Math.abs(a.gap - b.gap) > 0.001) return a.gap - b.gap;
          if (a.needsHalf !== b.needsHalf) return a.needsHalf ? 1 : -1;
          return a.variance - b.variance;
        });
        break;
      case "simple": // จำง่าย
        sorted.sort((a, b) => {
          if (a.numDistinctDoses !== b.numDistinctDoses) return a.numDistinctDoses - b.numDistinctDoses;
          if (a.needsHalf !== b.needsHalf) return a.needsHalf ? 1 : -1;
          if (a.numTabletTypes !== b.numTabletTypes) return a.numTabletTypes - b.numTabletTypes;
          return a.gap - b.gap;
        });
        break;
      default:
        sorted.sort((a, b) => a.gap - b.gap);
    }
    return sorted.slice(0, 12);
  }, [allOptions, sortPref]);

  const schedule = options[selIdx]?.schedule || Array(7).fill(0);

  const combos = useMemo(() => schedule.map(d => findTabletCombo(d, tablets)), [schedule, tablets]);

  const wkTotal = schedule.reduce((s, d) => s + d, 0);
  const dayAvg = (wkTotal / 7).toFixed(2);

  const pillCounts = useMemo(() => {
    const counts = {};
    tablets.forEach(t => { counts[t] = 0; });
    const wks = Math.floor(appointDays / 7);
    const ext = appointDays % 7;
    schedule.forEach((dose, di) => {
      const c = combos[di];
      if (!c.possible) return;
      const times = wks + (di < ext ? 1 : 0);
      c.parts.forEach(p => {
        if (!counts[p.mg]) counts[p.mg] = 0;
        counts[p.mg] += p.half ? Math.ceil(p.n * times / 2) : p.n * times;
      });
    });
    return counts;
  }, [schedule, combos, appointDays, tablets]);

  const totalPills = Object.values(pillCounts).reduce((s, c) => s + c, 0);

  const adjustVal = (delta) => {
    if (inputMode === "daily") setDailyInput(p => Math.max(0, Math.round((p + delta) * 10) / 10));
    else setWeeklyTarget(p => Math.max(0, Math.round((p + delta) * 10) / 10));
    setSelIdx(0);
  };

  // Real warfarin tablet colors
  const TC = { 1: "#BDBDBD", 2: "#FF8C00", 3: "#4285F4", 4: "#FFD600", 5: "#EC407A" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0D1B2A 0%, #1B2D44 50%, #162235 100%)",
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
      color: "#E0E8F0",
      fontSize: 18,
      lineHeight: 1.7,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Full-screen home menu (mobile-style tiles) */}
      {homeOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "radial-gradient(circle at top, rgba(144,202,249,0.22), transparent 55%) , rgba(3,13,25,0.96)",
          display: "flex",
          alignItems: "stretch",
          justifyContent: "flex-start",
          padding: "70px 16px 24px",
          overflowY: "auto",
        }}>
          <div style={{ width: "100%", maxWidth: 440, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#E3F2FD" }}>เลือกโหมดการใช้งาน</div>
              <button
                onClick={() => setHomeOpen(false)}
                style={{
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  color: "#CFD8DC",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                ปิด
              </button>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 12,
            }}>
              {[
                { id: "plan", ic: "🎯", title: "วางแผน dose", desc: "กระจายขนาดยาให้สม่ำเสมอ" },
                { id: "count", ic: "🧮", title: "นับเม็ดยา", desc: "คำนวณจำนวนเม็ดยา/นัด" },
                { id: "inr", ic: "🩸", title: "แปลผล INR", desc: "ความหมาย/การจัดการตาม INR" },
                { id: "preop", ic: "🔪", title: "เตรียมผ่าตัด", desc: "แนวทางจัดการ warfarin ก่อนผ่า" },
                { id: "interact", ic: "⚠️", title: "ยาที่มี interaction", desc: "ดูยาเสี่ยง INR/เลือดออก" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setHomeOpen(false); }}
                  style={{
                    border: "none",
                    borderRadius: 18,
                    padding: "16px 14px",
                    background: tab === t.id ? "linear-gradient(145deg, #1E4D8C, #2B6FBF)" : "rgba(255,255,255,0.04)",
                    boxShadow: tab === t.id ? "0 8px 22px rgba(4,12,24,0.9)" : "0 4px 14px rgba(0,0,0,0.55)",
                    color: "#E0E8F0",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    width: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 26 }}>{t.ic}</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#90A4AE" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header + Nav */}
      <div>
        <div style={{
          background: "linear-gradient(135deg, #1A365D 0%, #2B5EA7 60%, #1A365D 100%)",
          padding: "18px 16px 12px", borderBottom: "2px solid rgba(100,181,246,0.35)",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: "linear-gradient(135deg, #EF5350, #C62828)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, boxShadow: "0 3px 12px rgba(239,83,80,0.3)",
          }}>💊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => setHomeOpen(true)}
              style={{
                padding: 0,
                margin: 0,
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <h1 style={{
                margin: 0, fontSize: 19, fontWeight: 800,
                background: "linear-gradient(90deg, #FFF, #90CAF9)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Warfarin Dose Planner</h1>
              <p style={{ margin: 0, fontSize: 11, color: "#7EB3DB", fontWeight: 300 }}>
                คำนวณอัตโนมัติ • กระจาย dose ให้สม่ำเสมอ • นับเม็ดยา
              </p>
            </button>
          </div>
          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Font size mode */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 6px",
              borderRadius: 999,
              background: "rgba(3,13,25,0.6)",
            }}>
              {[
                { id: "normal", label: "A", fs: 13 },
                { id: "large", label: "A", fs: 15 },
                { id: "xlarge", label: "A", fs: 17 },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFontMode(f.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "2px 6px",
                    background: fontMode === f.id ? "rgba(144,202,249,0.9)" : "transparent",
                    color: fontMode === f.id ? "#0D1B2A" : "#E3F2FD",
                    cursor: "pointer",
                    fontSize: f.fs,
                    lineHeight: 1,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Hamburger */}
            <button
              onClick={() => setNavOpen(o => !o)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.3)",
                background: navOpen ? "rgba(15,76,129,0.9)" : "rgba(13,45,80,0.7)",
                color: "#E3F2FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
              }}
            >
              {navOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {/* Nav menu */}
        {navOpen && (
          <div style={{
            marginTop: 10,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: 14,
            border: "1px solid rgba(144,202,249,0.6)",
            background: "rgba(5,25,45,0.96)",
            padding: 8,
            boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
          }}>
            {[
              { id: "plan", ic: "🎯", l: "วางแผน" },
              { id: "count", ic: "🧮", l: "นับเม็ด" },
              { id: "inr", ic: "🩸", l: "INR" },
              { id: "preop", ic: "🔪", l: "Pre-op" },
              { id: "interact", ic: "⚠️", l: "Interaction" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setNavOpen(false); }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "none",
                  marginBottom: 4,
                  background: tab === t.id ? "linear-gradient(135deg, #1E4D8C, #2B6FBF)" : "rgba(255,255,255,0.04)",
                  color: tab === t.id ? "#FFF" : "#AFC7E4",
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{t.ic}</span>
                <span>{t.l}</span>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      <div style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "14px 12px 50px",
        transform: `scale(${fontScale})`,
        transformOrigin: "top center",
      }}>

        {/* Tablet Select — show only in วางแผน & นับเม็ด */}
        {(tab === "plan" || tab === "count") && (
          <Card>
            <Label icon="🏥" text="เม็ดยาที่มีในโรงพยาบาล" />
            <div style={{ display: "flex", gap: 6 }}>
              {ALL_TABLETS.map(mg => {
                const on = tablets.includes(mg);
                const pc = PILL_COLORS[mg];
                return (
                  <button key={mg} onClick={() => toggleTab(mg)} style={{
                    flex: 1, padding: "8px 2px", borderRadius: 12, cursor: "pointer",
                    border: `2px solid ${on ? TC[mg] : "rgba(255,255,255,0.08)"}`,
                    background: on ? `${TC[mg]}15` : "rgba(255,255,255,0.02)",
                    color: on ? "#FFF" : "#4A5A6A", fontFamily: "inherit",
                    fontWeight: 700, fontSize: 13, transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                  }}>
                    <PillDot mg={mg} on={on} />
                    <span>{mg} mg</span>
                    <span style={{ fontSize: 9, fontWeight: 400, color: on ? pc.stroke : "#4A5A6A" }}>
                      {pc.label}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 400, opacity: .7 }}>{on ? "✓ มี" : "ไม่มี"}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* ═══════════ PLAN TAB ═══════════ */}
        {tab === "plan" && (<>

          {/* Target Dose */}
          <Card>
            <Label icon="🎯" text="เป้าหมายขนาดยา" />
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["weekly", "daily"].map(m => (
                <button key={m} onClick={() => {
                  setInputMode(m);
                  if (m === "daily") setDailyInput(Math.round(weeklyTarget / 7 * 10) / 10);
                  if (m === "weekly") setWeeklyTarget(Math.round(dailyInput * 7 * 10) / 10);
                  setSelIdx(0);
                }} style={{
                  flex: 1, padding: "7px", borderRadius: 10, border: "none",
                  background: inputMode === m ? "rgba(100,181,246,0.18)" : "rgba(255,255,255,0.03)",
                  color: inputMode === m ? "#90CAF9" : "#4A5A6A",
                  fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  {m === "weekly" ? "mg/สัปดาห์" : "mg/วัน"}
                </button>
              ))}
            </div>

            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              <StepBtn label="−−" onClick={() => adjustVal(inputMode === "daily" ? -1 : -7)} />
              <StepBtn label="−" onClick={() => adjustVal(inputMode === "daily" ? -0.5 : -0.5)} small />
              <div style={{ textAlign: "center" }}>
                <input type="number" step={0.5} min={0}
                  value={inputMode === "daily" ? dailyInput : weeklyTarget}
                  onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    if (inputMode === "daily") setDailyInput(v); else setWeeklyTarget(v);
                    setSelIdx(0);
                  }}
                  style={{
                    width: 90, textAlign: "center", padding: "8px", borderRadius: 12,
                    border: "2px solid rgba(100,181,246,0.35)",
                    background: "rgba(255,255,255,0.05)", color: "#FFF",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
                  }}
                />
                <div style={{ fontSize: 11, color: "#5A7A9A", marginTop: 3 }}>
                  {inputMode === "daily" ? "mg/วัน" : "mg/สัปดาห์"}
                </div>
              </div>
              <StepBtn label="+" onClick={() => adjustVal(inputMode === "daily" ? 0.5 : 0.5)} small />
              <StepBtn label="++" onClick={() => adjustVal(inputMode === "daily" ? 1 : 7)} />
            </div>

            <div style={{ textAlign: "center", fontSize: 12, color: "#7EB3DB" }}>
              {inputMode === "daily"
                ? <span>= <b>{effWeekly}</b> mg/สัปดาห์</span>
                : <span>= เฉลี่ย <b>{(effWeekly / 7).toFixed(2)}</b> mg/วัน</span>
              }
            </div>

            {/* Quick adjust — Fixed mg based on available tablets */}
            {(() => {
              // Generate increments from available tablets: half & whole, ×1 ×2 ×3
              const units = [...new Set(tablets.flatMap(t => [t / 2, t]))].sort((a, b) => a - b);
              const weeklySteps = [...new Set(
                units.flatMap(u => [u, u * 2, u * 3])
              )].filter(v => v > 0 && v <= 21).sort((a, b) => a - b);
              const dailySteps = units.filter(v => v > 0 && v <= 5);
              const steps = inputMode === "daily" ? dailySteps : weeklySteps;

              return (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5A7A9A", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                    ⚡ ปรับเร็ว — ตามเม็ดยาที่มี ({tablets.map(t => `${t}mg`).join(", ")})
                  </div>
                  <div style={{ fontSize: 9, color: "#4A5A6A", marginBottom: 8 }}>
                    {inputMode === "daily" ? "mg/วัน" : "mg/สัปดาห์"} • ½เม็ด = {tablets.map(t => `${t/2}`).join(", ")} mg
                  </div>

                  {/* Decrease row */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 4 }}>
                    {[...steps].reverse().map(v => (
                      <button key={`-${v}`} onClick={() => adjustVal(-v)} style={{
                        padding: "6px 8px", borderRadius: 8, minWidth: 42,
                        border: "1px solid rgba(239,83,80,0.25)",
                        background: "rgba(239,83,80,0.07)",
                        color: "#EF9A9A",
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>−{v % 1 === 0 ? v : v.toFixed(1)}</button>
                    ))}
                  </div>

                  {/* Increase row */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {steps.map(v => (
                      <button key={`+${v}`} onClick={() => adjustVal(v)} style={{
                        padding: "6px 8px", borderRadius: 8, minWidth: 42,
                        border: "1px solid rgba(102,187,106,0.25)",
                        background: "rgba(102,187,106,0.07)",
                        color: "#A5D6A7",
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>+{v % 1 === 0 ? v : v.toFixed(1)}</button>
                    ))}
                  </div>

                  {/* Quick adjust — Smart Percentage */}
                  {(() => {
                    const current = effWeekly;
                    if (current <= 0) return null;
                    const allTotals = getAchievableWeeklyTotals(tablets);
                    
                    // Find achievable totals within ±50% of current
                    const nearby = allTotals
                      .filter(t => t !== current && t >= current * 0.5 && t <= current * 1.5)
                      .map(t => ({
                        target: t,
                        pct: Math.round((t - current) / current * 100),
                        diff: t - current,
                      }))
                      .filter(x => x.pct !== 0)
                      // deduplicate same percentage
                      .filter((x, i, arr) => arr.findIndex(a => a.pct === x.pct) === i)
                      .sort((a, b) => a.pct - b.pct);

                    const decreases = nearby.filter(x => x.pct < 0).slice(-6); // closest 6 decreases
                    const increases = nearby.filter(x => x.pct > 0).slice(0, 6); // closest 6 increases

                    if (decreases.length === 0 && increases.length === 0) return null;

                    return (
                      <>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#5A7A9A", marginTop: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5 }}>
                          ⚡ ปรับเร็ว — % ที่จัดยาได้จริง
                        </div>
                        <div style={{ fontSize: 9, color: "#4A5A6A", marginBottom: 6 }}>
                          แสดงเฉพาะ % ที่ลงตัวกับเม็ดยาที่มี
                        </div>

                        {decreases.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 4 }}>
                            {decreases.map(x => (
                              <button key={x.pct} onClick={() => {
                                if (inputMode === "daily") setDailyInput(Math.round(x.target / 7 * 10) / 10);
                                else setWeeklyTarget(x.target);
                                setSelIdx(0);
                              }} style={{
                                padding: "6px 6px", borderRadius: 8, minWidth: 52,
                                border: "1px solid rgba(239,83,80,0.25)",
                                background: "rgba(239,83,80,0.07)",
                                color: "#EF9A9A",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                              }}>
                                <span>{x.pct}%</span>
                                <span style={{ fontSize: 8, opacity: .7 }}>→{x.target}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {increases.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                            {increases.map(x => (
                              <button key={x.pct} onClick={() => {
                                if (inputMode === "daily") setDailyInput(Math.round(x.target / 7 * 10) / 10);
                                else setWeeklyTarget(x.target);
                                setSelIdx(0);
                              }} style={{
                                padding: "6px 6px", borderRadius: 8, minWidth: 52,
                                border: "1px solid rgba(102,187,106,0.25)",
                                background: "rgba(102,187,106,0.07)",
                                color: "#A5D6A7",
                                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                              }}>
                                <span>+{x.pct}%</span>
                                <span style={{ fontSize: 8, opacity: .7 }}>→{x.target}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            })()}
          </Card>

          {/* Options with preference selector */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="📊" text={`แผนจัดยาแนะนำ (${effWeekly} mg/wk)`} />

            {/* Preference selector */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#5A7A9A", marginBottom: 6, fontWeight: 600 }}>เรียงแผนตาม:</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {[
                  { id: "even", icon: "💉", label: "ระดับยาใกล้เคียง", desc: "dose แต่ละวันต่างกันน้อย" },
                  { id: "nohalf", icon: "💊", label: "ไม่หักครึ่งเม็ด", desc: "ใช้เฉพาะเม็ดเต็ม" },
                  { id: "single", icon: "🎯", label: "พกยาแบบเดียว", desc: "ใช้เม็ดยาน้อยชนิด" },
                  { id: "simple", icon: "🧠", label: "จำง่ายที่สุด", desc: "จำนวน dose น้อย ไม่ซับซ้อน" },
                ].map(p => (
                  <button key={p.id} onClick={() => { setSortPref(p.id); setSelIdx(0); }} style={{
                    flex: 1, minWidth: 70, padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${sortPref === p.id ? "#64B5F6" : "rgba(255,255,255,0.06)"}`,
                    background: sortPref === p.id ? "rgba(100,181,246,0.12)" : "rgba(255,255,255,0.02)",
                    fontFamily: "inherit", textAlign: "center",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 16 }}>{p.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sortPref === p.id ? "#FFF" : "#6A8AAB", marginTop: 2 }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 8, color: "#4A5A6A", marginTop: 1 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {options.length === 0 ? (
              <div style={{ textAlign: "center", padding: 16, color: "#EF5350", fontSize: 13 }}>
                ❌ ไม่พบแผนที่ลงตัว — ลองปรับเป้าหมายหรือเพิ่มชนิดเม็ดยา
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {options.map((opt, i) => {
                  const isSel = selIdx === i;
                  return (
                    <button key={`${opt.doseHigh}-${opt.doseLow}-${opt.nHigh}`} onClick={() => setSelIdx(i)} style={{
                      width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 12,
                      border: `2px solid ${isSel ? "#64B5F6" : "rgba(255,255,255,0.06)"}`,
                      background: isSel
                        ? "linear-gradient(135deg, rgba(100,181,246,0.12), rgba(30,77,140,0.08))"
                        : "rgba(255,255,255,0.015)",
                      cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      position: "relative",
                    }}>
                      {i === 0 && (
                        <span style={{
                          position: "absolute", top: -7, right: 8,
                          background: "linear-gradient(135deg, #4CAF50, #388E3C)",
                          color: "#FFF", fontSize: 9, fontWeight: 800, padding: "1px 7px",
                          borderRadius: 5, letterSpacing: .5,
                        }}>✓ แนะนำ</span>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: isSel ? "#FFF" : "#8AACCA", flex: 1 }}>
                          {opt.label}
                        </span>
                      </div>

                      {/* Property tags */}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
                        <EvennessTag gap={opt.gap} />
                        {!opt.needsHalf && (
                          <span style={tagStyle("#66BB6A")}>💊 ไม่หักครึ่ง</span>
                        )}
                        {opt.needsHalf && (
                          <span style={tagStyle("#FF9800")}>✂️ ต้องหักครึ่ง</span>
                        )}
                        {opt.numTabletTypes <= 1 && (
                          <span style={tagStyle("#64B5F6")}>🎯 ยาแบบเดียว</span>
                        )}
                        {opt.numDistinctDoses === 1 && (
                          <span style={tagStyle("#AB47BC")}>🧠 ทุกวันเท่ากัน</span>
                        )}
                        {opt.numDistinctDoses === 2 && opt.numTabletTypes <= 1 && !opt.needsHalf && (
                          <span style={tagStyle("#26A69A")}>👍 จำง่าย</span>
                        )}
                      </div>

                      {/* Mini schedule preview */}
                      <div style={{ display: "flex", gap: 2 }}>
                        {opt.schedule.map((d, di) => (
                          <div key={di} style={{
                            flex: 1, textAlign: "center", padding: "3px 0", borderRadius: 5,
                            background: d === opt.doseHigh && opt.gap > 0
                              ? "rgba(100,181,246,0.12)" : "rgba(255,255,255,0.04)",
                          }}>
                            <div style={{ fontSize: 8, color: "#4A5A6A", fontWeight: 700 }}>{DAYS_SHORT[di]}</div>
                            <div style={{
                              fontSize: 11, fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: d === 0 ? "#EF9A9A" : "#90CAF9",
                            }}>{d}</div>
                          </div>
                        ))}
                      </div>

                      {/* Summary line */}
                      <div style={{ marginTop: 4, fontSize: 9, color: "#4A5A6A", display: "flex", gap: 8 }}>
                        {opt.gap > 0 && <span>ต่าง {opt.gap} mg</span>}
                        <span>ยา {opt.numTabletTypes} ชนิด</span>
                        <span>{opt.totalPillsPerWeek} เม็ด/wk</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Full schedule detail */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="📅" text="ตารางยารายวัน (แผนที่เลือก)" />
            {DAYS_TH.map((day, idx) => {
              const dose = schedule[idx];
              const combo = combos[idx];
              return (
                <div key={idx} style={{
                  padding: "8px 10px", borderRadius: 10, marginBottom: 4,
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ minWidth: 48, fontWeight: 700, fontSize: 13, color: "#90CAF9" }}>{DAYS_SHORT[idx]}</span>
                    <span style={{
                      minWidth: 55, textAlign: "center",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 800,
                      color: dose === 0 ? "#EF5350" : "#FFF",
                    }}>{dose === 0 ? "หยุด" : `${dose} mg`}</span>
                    <span style={{ flex: 1, fontSize: 10, color: "#5A7A9A", textAlign: "right" }}>
                      {PillComboText({ combo })}
                    </span>
                  </div>
                  {/* Pill visual row */}
                  <div style={{ marginLeft: 54 }}>
                    <PillComboVisual combo={combo} />
                  </div>
                </div>
              );
            })}

            <div style={{
              marginTop: 10, padding: 12, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(30,77,140,0.15), rgba(100,181,246,0.06))",
              border: "1px solid rgba(100,181,246,0.15)",
              display: "flex", justifyContent: "space-around", textAlign: "center",
            }}>
              <div>
                <div style={{ fontSize: 9, color: "#5A7A9A", fontWeight: 700, textTransform: "uppercase" }}>รวม/สัปดาห์</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                  {wkTotal} <span style={{ fontSize: 11, color: "#5A7A9A" }}>mg</span>
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />
              <div>
                <div style={{ fontSize: 9, color: "#5A7A9A", fontWeight: 700, textTransform: "uppercase" }}>เฉลี่ย/วัน</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#90CAF9" }}>
                  {dayAvg} <span style={{ fontSize: 11, color: "#5A7A9A" }}>mg</span>
                </div>
              </div>
            </div>
          </Card>
        </>)}

        {/* ═══════════ COUNT TAB ═══════════ */}
        {tab === "count" && (<>

          <Card>
            <Label icon="📆" text="ระยะเวลาถึงนัดครั้งหน้า" />
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {[7, 14, 21, 28, 30, 42, 56, 60, 90].map(d => (
                <button key={d} onClick={() => setAppointDays(d)} style={{
                  padding: "7px 11px", borderRadius: 10, cursor: "pointer",
                  border: appointDays === d ? "2px solid #64B5F6" : "1px solid rgba(255,255,255,0.08)",
                  background: appointDays === d ? "rgba(100,181,246,0.15)" : "rgba(255,255,255,0.02)",
                  color: appointDays === d ? "#FFF" : "#5A7A9A",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600,
                  lineHeight: 1.3,
                }}>
                  {d} <span style={{ fontSize: 10 }}>วัน</span>
                  {d >= 7 && <div style={{ fontSize: 9, color: "#4A5A6A" }}>({(d / 7).toFixed(d % 7 === 0 ? 0 : 1)} wk)</div>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#6A8AAB" }}>กำหนดเอง:</span>
              <input type="number" min={1} max={365} value={appointDays}
                onChange={e => setAppointDays(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 65, padding: "6px 8px", borderRadius: 8, textAlign: "center",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#FFF", fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
                }}
              />
              <span style={{ fontSize: 12, color: "#6A8AAB" }}>วัน</span>
            </div>
          </Card>

          {/* Current plan mini */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="💊" text="แผนยาปัจจุบัน" />
            <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
              {DAYS_SHORT.map((d, i) => (
                <div key={i} style={{
                  flex: 1, textAlign: "center", padding: "4px 0", borderRadius: 6,
                  background: schedule[i] === 0 ? "rgba(239,83,80,0.1)" : "rgba(100,181,246,0.08)",
                }}>
                  <div style={{ fontSize: 9, color: "#4A5A6A", fontWeight: 700 }}>{d}</div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                    color: schedule[i] === 0 ? "#EF9A9A" : "#FFF",
                  }}>{schedule[i]}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#5A7A9A" }}>
              {wkTotal} mg/wk • เฉลี่ย {dayAvg} mg/d
            </div>
          </Card>

          {/* Pill Count */}
          <Card style={{
            marginTop: 12,
            background: "rgba(76,175,80,0.05)",
            border: "1px solid rgba(76,175,80,0.2)",
          }}>
            <Label icon="🧮" text={`จำนวนเม็ดยาที่ต้องจ่าย (${appointDays} วัน)`} color="#81C784" />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {tablets.map(mg => {
                const cnt = pillCounts[mg] || 0;
                return (
                  <div key={mg} style={{
                    flex: 1, minWidth: 100, padding: "12px 8px", borderRadius: 14, textAlign: "center",
                    background: `${TC[mg]}0D`, border: `2px solid ${TC[mg]}30`,
                  }}>
                    <PillDot mg={mg} on />
                    <div style={{ fontSize: 11, color: "#6A8AAB", marginTop: 4 }}>
                      {mg} mg <span style={{ color: PILL_COLORS[mg]?.stroke }}>({PILL_COLORS[mg]?.label})</span>
                    </div>
                    <div style={{
                      fontSize: 34, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                      color: "#FFF", lineHeight: 1.1, marginTop: 2,
                    }}>{cnt}</div>
                    <div style={{ fontSize: 11, color: "#5A7A9A" }}>เม็ด</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: 14, borderRadius: 14, textAlign: "center",
              background: "linear-gradient(135deg, rgba(76,175,80,0.1), rgba(56,142,60,0.06))",
              border: "1px solid rgba(76,175,80,0.18)",
            }}>
              <div style={{ fontSize: 10, color: "#81C784", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                รวมเม็ดยาทั้งหมด
              </div>
              <div style={{
                fontSize: 44, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                background: "linear-gradient(90deg, #81C784, #64B5F6)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2,
              }}>{totalPills}</div>
              <div style={{ fontSize: 12, color: "#6A8AAB" }}>
                เม็ด สำหรับ {appointDays} วัน ({(appointDays / 7).toFixed(appointDays % 7 === 0 ? 0 : 1)} สัปดาห์)
              </div>
            </div>
          </Card>

          {/* Day breakdown */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="📋" text="วิธีจัดยาแต่ละวัน" />
            {DAYS_TH.map((day, idx) => {
              const dose = schedule[idx];
              const combo = combos[idx];
              return (
                <div key={idx} style={{
                  padding: "7px 8px", borderRadius: 8, marginBottom: 3,
                  background: idx % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ minWidth: 44, fontWeight: 700, fontSize: 12, color: "#90CAF9" }}>{DAYS_SHORT[idx]}</span>
                    <span style={{
                      minWidth: 48, textAlign: "center",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                      color: dose === 0 ? "#EF9A9A" : "#FFF",
                    }}>{dose === 0 ? "หยุด" : `${dose} mg`}</span>
                    <span style={{ fontSize: 10, color: "#4A5A6A", flex: 1, textAlign: "right" }}>
                      {PillComboText({ combo })}
                    </span>
                  </div>
                  <div style={{ marginLeft: 44 }}>
                    <PillComboVisual combo={combo} />
                  </div>
                </div>
              );
            })}
          </Card>
        </>)}

        {/* ═══════════ INR TAB ═══════════ */}
        {tab === "inr" && (<>

          {/* Indication / Target INR */}
          <Card>
            <Label icon="🎯" text="Indication & Target INR" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "standard", label: "มาตรฐาน (INR 2.0-3.0)", sub: "AF, DVT/PE, Bioprosthetic valve, Mechanical aortic valve (bileaflet เช่น St. Jude) ไม่มี risk factors", lo: 2.0, hi: 3.0 },
                { id: "high", label: "Mechanical valve (INR 2.5-3.5)", sub: "Mechanical mitral valve, Mechanical aortic valve (bileaflet) + risk factors (AF, LV dysfunction, hypercoagulable)", lo: 2.5, hi: 3.5 },
                { id: "aps", label: "APS (INR 2.5-3.5)", sub: "Antiphospholipid syndrome with thrombosis", lo: 2.5, hi: 3.5 },
              ].map(opt => {
                const sel = indication === opt.id;
                return (
                  <button key={opt.id} onClick={() => setIndication(opt.id)} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: `2px solid ${sel ? "#64B5F6" : "rgba(255,255,255,0.06)"}`,
                    background: sel ? "rgba(100,181,246,0.12)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#FFF" : "#8AACCA" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#5A7A9A", marginTop: 2 }}>{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Current INR Input */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="🩸" text="ค่า INR ปัจจุบัน" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <input
                type="number" step={0.1} min={0.5} max={20}
                value={currentINR}
                onChange={e => setCurrentINR(e.target.value)}
                placeholder="ใส่ค่า INR"
                style={{
                  width: 120, textAlign: "center", padding: "12px", borderRadius: 14,
                  border: "2px solid rgba(100,181,246,0.35)",
                  background: "rgba(255,255,255,0.06)", color: "#FFF",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700,
                }}
              />
            </div>

            {/* Quick INR buttons */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
              {[1.2, 1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10].map(v => (
                <button key={v} onClick={() => setCurrentINR(String(v))} style={{
                  padding: "5px 8px", borderRadius: 6, minWidth: 36,
                  border: `1px solid ${parseFloat(currentINR) === v ? "#64B5F6" : "rgba(255,255,255,0.08)"}`,
                  background: parseFloat(currentINR) === v ? "rgba(100,181,246,0.15)" : "rgba(255,255,255,0.02)",
                  color: parseFloat(currentINR) === v ? "#FFF" : "#5A7A9A",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>{v}</button>
              ))}
            </div>

            {/* Bleeding status */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "#7EB3DB", marginBottom: 6, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span>สถานะเลือดออก</span>
                <span style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <a
                    href="/PCC_INFORM.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#E3F2FD",
                      fontSize: 10,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    📄 เอกสาร PCC (ไทย)
                  </a>
                  <a
                    href="/warfarin_reverse.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,235,59,0.7)",
                      background: "rgba(255,235,59,0.06)",
                      color: "#FFF59D",
                      fontSize: 10,
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🩸 สรุป Warfarin reverse
                  </a>
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "none", label: "ไม่มีเลือดออก", color: "#66BB6A" },
                  { id: "minor", label: "Minor bleeding", color: "#FFC107" },
                  { id: "major", label: "Major/Life-threatening", color: "#EF5350" },
                ].map(b => (
                  <button key={b.id} onClick={() => setHasBleeding(b.id)} style={{
                    flex: 1, padding: "7px 4px", borderRadius: 8, cursor: "pointer",
                    border: `2px solid ${hasBleeding === b.id ? b.color : "rgba(255,255,255,0.06)"}`,
                    background: hasBleeding === b.id ? `${b.color}18` : "rgba(255,255,255,0.02)",
                    fontFamily: "inherit", fontSize: 10, fontWeight: 600,
                    color: hasBleeding === b.id ? "#FFF" : "#5A7A9A",
                  }}>{b.label}</button>
                ))}
              </div>
            </div>
          </Card>

          {/* ── INR Interpretation & Recommendation ── */}
          {currentINR && (() => {
            const inr = parseFloat(currentINR);
            if (isNaN(inr) || inr < 0.5) return null;

            const targets = {
              standard: { lo: 2.0, hi: 3.0, label: "2.0-3.0" },
              high: { lo: 2.5, hi: 3.5, label: "2.5-3.5" },
              aps: { lo: 2.5, hi: 3.5, label: "2.5-3.5" },
            };
            const t = targets[indication];
            const midTarget = (t.lo + t.hi) / 2;

            let status, statusColor, statusIcon;
            if (inr < t.lo) { status = "ต่ำกว่าเป้าหมาย (Subtherapeutic)"; statusColor = "#FF9800"; statusIcon = "⬇️"; }
            else if (inr > t.hi && inr <= 4.5) { status = "สูงกว่าเป้าหมายเล็กน้อย"; statusColor = "#FFC107"; statusIcon = "⬆️"; }
            else if (inr > 4.5 && inr <= 6) { status = "สูงเกิน (Supratherapeutic)"; statusColor = "#EF5350"; statusIcon = "🔴"; }
            else if (inr > 6 && inr <= 9) { status = "สูงมาก — เสี่ยงเลือดออก"; statusColor = "#EF5350"; statusIcon = "🚨"; }
            else if (inr > 9) { status = "อันตราย — ต้องแก้ไขเร่งด่วน"; statusColor = "#D32F2F"; statusIcon = "🆘"; }
            else { status = "อยู่ในเป้าหมาย (Therapeutic)"; statusColor = "#66BB6A"; statusIcon = "✅"; }

            return (
              <>
                {/* Status Banner */}
                <Card style={{
                  marginTop: 12,
                  background: `${statusColor}10`,
                  border: `2px solid ${statusColor}40`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{statusIcon}</span>
                    <div>
                      <div style={{
                        fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                        color: statusColor,
                      }}>INR {inr.toFixed(1)}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{status}</div>
                      <div style={{ fontSize: 11, color: "#6A8AAB" }}>เป้าหมาย: INR {t.label}</div>
                    </div>
                  </div>

                  {/* ── INR In Range ── */}
                  {inr >= t.lo && inr <= t.hi && hasBleeding === "none" && (
                    <div style={{ fontSize: 12, color: "#A5D6A7", lineHeight: 1.8, padding: "8px 12px", borderRadius: 10, background: "rgba(102,187,106,0.08)" }}>
                      ✅ <b>INR อยู่ในเป้าหมาย</b> — ให้ warfarin ขนาดเดิมต่อ<br />
                      📅 นัดตรวจ INR ครั้งหน้า: 4 สัปดาห์ (ถ้า stable)
                    </div>
                  )}

                  {/* ── Subtherapeutic (INR ต่ำกว่าเป้าหมาย) ── */}
                  {inr < t.lo && (
                    <div style={{ fontSize: 12, color: "#E0E8F0", lineHeight: 2 }}>
                      <div style={{ fontWeight: 800, color: "#FF9800", marginBottom: 6, fontSize: 14 }}>
                        📈 ต้องเพิ่ม Warfarin
                      </div>

                      {inr >= t.lo - 0.3 && (
                        <div style={recBox("#FF9800")}>
                          <b>INR ต่ำกว่าเป้าเล็กน้อย</b><br />
                          • เพิ่ม weekly dose <b>5-10%</b><br />
                          • ตรวจ INR ซ้ำใน 1-2 สัปดาห์
                        </div>
                      )}

                      {inr < t.lo - 0.3 && inr >= t.lo - 0.7 && (
                        <div style={recBox("#FF9800")}>
                          <b>INR ต่ำกว่าเป้าปานกลาง</b><br />
                          • เพิ่ม weekly dose <b>10-20%</b><br />
                          • ตรวจ INR ซ้ำใน 1-2 สัปดาห์<br />
                          • ถ้าเสี่ยงลิ่มเลือดสูง อาจพิจารณา bridge ด้วย LMWH
                        </div>
                      )}

                      {inr < t.lo - 0.7 && (
                        <div style={recBox("#EF5350")}>
                          <b>INR ต่ำมาก — เสี่ยงลิ่มเลือด</b><br />
                          • เพิ่ม weekly dose <b>15-25%</b><br />
                          • พิจารณา bridge ด้วย <b>LMWH (Enoxaparin 1 mg/kg q12h)</b> ถ้า high-risk<br />
                          • ตรวจ INR ซ้ำใน <b>5-7 วัน</b><br />
                          • ค้นหาสาเหตุ: ลืมทานยา? เริ่มยาใหม่ (enzyme inducer)? อาหาร vit K?
                        </div>
                      )}

                      {/* Dose adjust quick calc */}
                      <div style={{
                        marginTop: 8, padding: "10px 12px", borderRadius: 10,
                        background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.2)",
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#FFB74D", marginBottom: 6 }}>🧮 ตัวช่วยคำนวณ dose adjustment</div>
                        <div style={{ fontSize: 11, color: "#AAB8C5", lineHeight: 1.8 }}>
                          {effWeekly > 0 && (<>
                            Weekly dose ปัจจุบัน: <b style={{ color: "#FFF" }}>{effWeekly} mg/wk</b><br />
                            +5% = <b>{(effWeekly * 1.05).toFixed(1)}</b> mg/wk •
                            +10% = <b>{(effWeekly * 1.10).toFixed(1)}</b> mg/wk •
                            +15% = <b>{(effWeekly * 1.15).toFixed(1)}</b> mg/wk •
                            +20% = <b>{(effWeekly * 1.20).toFixed(1)}</b> mg/wk •
                            +25% = <b>{(effWeekly * 1.25).toFixed(1)}</b> mg/wk
                          </>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Supratherapeutic (INR สูงเกิน) ── */}
                  {inr > t.hi && (
                    <div style={{ fontSize: 12, color: "#E0E8F0", lineHeight: 2 }}>
                      <div style={{ fontWeight: 800, color: "#EF5350", marginBottom: 6, fontSize: 14 }}>
                        📉 INR สูงเกิน — ต้องปรับลด/แก้ไข
                      </div>

                      {/* INR slightly above target */}
                      {inr > t.hi && inr <= t.hi + 0.5 && hasBleeding === "none" && (
                        <div style={recBox("#FFC107")}>
                          <b>สูงกว่าเป้าเล็กน้อย (≤{(t.hi + 0.5).toFixed(1)})</b><br />
                          • ลด weekly dose <b>5-10%</b><br />
                          • ไม่จำเป็นต้องหยุดยา<br />
                          • ตรวจ INR ซ้ำใน 1-2 สัปดาห์
                        </div>
                      )}

                      {/* INR 4.5-6 no bleeding */}
                      {inr > Math.max(t.hi + 0.5, 4.5) && inr <= 6 && hasBleeding === "none" && (
                        <div style={recBox("#FF9800")}>
                          <b>INR 4.5-6.0 ไม่มีเลือดออก</b><br />
                          • <b>หยุด warfarin 1-2 dose</b><br />
                          • ลด weekly dose <b>10-20%</b> เมื่อกลับมาให้<br />
                          • ไม่จำเป็นต้องให้ Vitamin K (ในคนไม่มีเลือดออก)<br />
                          • ตรวจ INR ซ้ำใน <b>1-3 วัน</b>
                        </div>
                      )}

                      {/* INR 6-9 no bleeding */}
                      {inr > 6 && inr <= 9 && hasBleeding !== "major" && (
                        <div style={recBox("#EF5350")}>
                          <b>INR 6.0-9.0</b><br />
                          • <b>หยุด warfarin</b><br />
                          • พิจารณา <b>Vitamin K₁ (Phytonadione) 1-2.5 mg PO</b><br />
                          • ตรวจ INR ซ้ำใน <b>24 ชม.</b><br />
                          • ถ้า INR ยังสูง ให้ Vit K₁ เพิ่มได้อีก 1-2 mg<br />
                          • เมื่อ INR กลับมา therapeutic → ลด weekly dose <b>15-25%</b>
                        </div>
                      )}

                      {/* INR >9 no significant bleeding */}
                      {inr > 9 && hasBleeding !== "major" && (
                        <div style={recBox("#D32F2F")}>
                          <b>INR &gt;9.0 ไม่มี major bleeding</b><br />
                          • <b>หยุด warfarin ทันที</b><br />
                          • ให้ <b>Vitamin K₁ 2.5-5 mg PO</b><br />
                          • ตรวจ INR ซ้ำใน <b>24 ชม.</b><br />
                          • ถ้า INR ยังสูง &gt;6 ใน 24 ชม. → ให้ Vit K₁ เพิ่ม<br />
                          • Admit สังเกตอาการ ถ้ามี risk factors
                        </div>
                      )}

                      {/* Major/Life-threatening bleeding (any INR) */}
                      {hasBleeding === "major" && (
                        <div style={{
                          padding: 14, borderRadius: 12, marginTop: 6,
                          background: "linear-gradient(135deg, rgba(211,47,47,0.2), rgba(211,47,47,0.08))",
                          border: "2px solid rgba(211,47,47,0.5)",
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#EF5350", marginBottom: 8 }}>
                            🆘 MAJOR / LIFE-THREATENING BLEEDING
                          </div>
                          <div style={{ fontSize: 12, lineHeight: 2.2, color: "#E0E8F0" }}>
                            <b>1. หยุด warfarin ทันที</b><br />
                            <b>2. Vitamin K₁ 10 mg IV slow push</b> (ฉีดช้า &gt;10 นาที ลดเสี่ยง anaphylaxis)<br />
                            <b>3. 4-Factor PCC (Prothrombin Complex Concentrate)</b><br />
                            <div style={{
                              marginLeft: 16, padding: "8px 10px", borderRadius: 8,
                              background: "rgba(255,255,255,0.05)", marginTop: 4, marginBottom: 4,
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#FFB74D" }}>PCC Dosing (4-Factor):</div>
                              <div style={{ fontSize: 11, color: "#C0D0E0" }}>
                                {inr <= 4 && "• INR 2-4: 25 units/kg (max 2,500 units)"}
                                {inr > 4 && inr <= 6 && "• INR 4-6: 35 units/kg (max 3,500 units)"}
                                {inr > 6 && "• INR >6: 50 units/kg (max 5,000 units)"}
                              </div>
                            </div>
                            <b>ถ้าไม่มี PCC:</b> ให้ <b>FFP (Fresh Frozen Plasma) 15-20 mL/kg</b><br />
                            <div style={{ fontSize: 10, color: "#EF9A9A", marginTop: 4 }}>
                              ⚡ PCC ดีกว่า FFP: ออกฤทธิ์เร็วกว่า, volume น้อยกว่า, ไม่ต้องรอ thaw<br />
                              ⚡ ตรวจ INR ซ้ำ 15-30 นาทีหลังให้ PCC<br />
                              ⚡ Vit K₁ IV ต้องให้ร่วมด้วยเสมอ (PCC ออกฤทธิ์สั้น, Vit K₁ sustain effect)
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Minor bleeding */}
                      {hasBleeding === "minor" && inr > t.hi && (
                        <div style={recBox("#E040FB")}>
                          <b>Minor bleeding + INR สูง</b><br />
                          • <b>หยุด warfarin</b><br />
                          • <b>Vitamin K₁ {inr > 6 ? "2.5-5" : "1-2.5"} mg PO</b><br />
                          • รักษาจุดเลือดออก<br />
                          • ตรวจ INR ใน 24 ชม.<br />
                          • เมื่อเลือดหยุดและ INR กลับ therapeutic → ลด dose 15-25%
                        </div>
                      )}

                      {/* Dose adjustment calc for supra */}
                      {hasBleeding === "none" && inr <= 6 && (
                        <div style={{
                          marginTop: 8, padding: "10px 12px", borderRadius: 10,
                          background: "rgba(239,83,80,0.06)", border: "1px solid rgba(239,83,80,0.15)",
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#EF9A9A", marginBottom: 6 }}>🧮 ตัวช่วยคำนวณ dose adjustment</div>
                          <div style={{ fontSize: 11, color: "#AAB8C5", lineHeight: 1.8 }}>
                            {effWeekly > 0 && (<>
                              Weekly dose ปัจจุบัน: <b style={{ color: "#FFF" }}>{effWeekly} mg/wk</b><br />
                              −5% = <b>{(effWeekly * 0.95).toFixed(1)}</b> mg/wk •
                              −10% = <b>{(effWeekly * 0.90).toFixed(1)}</b> mg/wk •
                              −15% = <b>{(effWeekly * 0.85).toFixed(1)}</b> mg/wk •
                              −20% = <b>{(effWeekly * 0.80).toFixed(1)}</b> mg/wk •
                              −25% = <b>{(effWeekly * 0.75).toFixed(1)}</b> mg/wk
                            </>)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* ── Quick Reference Table ── */}
                <Card style={{ marginTop: 12 }}>
                  <Label icon="📊" text={`INR Management Summary (เป้าหมาย ${t.label})`} />
                  <div style={{ overflowX: "auto" }}>
                    {[
                      { range: `<${t.lo.toFixed(1)}`, color: "#FF9800", action: "เพิ่ม warfarin 5-25% ตามความรุนแรง", vitk: "-", extra: "พิจารณา LMWH bridge ถ้า high-risk" },
                      { range: `${t.lo.toFixed(1)}-${t.hi.toFixed(1)}`, color: "#66BB6A", action: "✅ Therapeutic — ให้ dose เดิม", vitk: "-", extra: "ตรวจ INR ทุก 4 สัปดาห์" },
                      { range: `${t.hi.toFixed(1)}-4.5`, color: "#FFC107", action: "ลด dose 5-15%", vitk: "-", extra: "ตรวจ INR 1-2 สัปดาห์" },
                      { range: "4.5-6.0", color: "#FF9800", action: "หยุด 1-2 dose, ลด 10-20%", vitk: "ไม่จำเป็น (ถ้าไม่เลือดออก)", extra: "ตรวจ INR 1-3 วัน" },
                      { range: "6.0-9.0", color: "#EF5350", action: "หยุด warfarin", vitk: "Vit K₁ 1-2.5 mg PO", extra: "ตรวจ INR 24 ชม." },
                      { range: ">9.0", color: "#D32F2F", action: "หยุดทันที", vitk: "Vit K₁ 2.5-5 mg PO", extra: "ตรวจ INR 24 ชม. + Admit" },
                      { range: "Major bleed", color: "#D32F2F", action: "หยุดทันที", vitk: "Vit K₁ 10 mg IV + PCC/FFP", extra: "ICU, ตรวจ INR q15-30min" },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 6, padding: "8px 6px", borderRadius: 8,
                        background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                        alignItems: "flex-start", marginBottom: 2,
                      }}>
                        <span style={{
                          minWidth: 65, fontSize: 11, fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: row.color,
                        }}>{row.range}</span>
                        <div style={{ flex: 1, fontSize: 10, color: "#AAB8C5", lineHeight: 1.6 }}>
                          <div><b style={{ color: "#E0E8F0" }}>{row.action}</b></div>
                          {row.vitk !== "-" && <div>💉 {row.vitk}</div>}
                          <div style={{ color: "#5A7A9A" }}>{row.extra}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Vitamin K / PCC / FFP reference */}
                <Card style={{ marginTop: 12 }}>
                  <Label icon="💉" text="Reversal Agents Quick Reference" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      {
                        name: "Vitamin K₁ (Phytonadione)",
                        icon: "💊",
                        color: "#66BB6A",
                        details: [
                          "PO: 1-2.5 mg (INR 6-9), 2.5-5 mg (INR >9)",
                          "IV: 10 mg slow push >10 min (life-threatening bleed)",
                          "ออกฤทธิ์: PO 24-48 ชม., IV 6-8 ชม.",
                          "⚠️ IV → เสี่ยง anaphylaxis ต้องฉีดช้า",
                          "⚠️ ถ้าให้มากเกินอาจทำให้ warfarin resistance 1-2 สัปดาห์",
                        ],
                      },
                      {
                        name: "4-Factor PCC",
                        icon: "🩸",
                        color: "#64B5F6",
                        details: [
                          "INR 2-4: 25 units/kg (max 2,500 U)",
                          "INR 4-6: 35 units/kg (max 3,500 U)",
                          "INR >6: 50 units/kg (max 5,000 U)",
                          "ออกฤทธิ์: 10-15 นาที",
                          "✅ First-line สำหรับ life-threatening bleed",
                          "ต้องให้ร่วมกับ Vit K₁ IV เสมอ",
                        ],
                      },
                      {
                        name: "FFP (Fresh Frozen Plasma)",
                        icon: "🫙",
                        color: "#FFB74D",
                        details: [
                          "15-20 mL/kg (ผู้ใหญ่ ~4-6 units)",
                          "ออกฤทธิ์: หลังให้เสร็จ (~30-60 นาที)",
                          "ใช้เมื่อไม่มี PCC",
                          "⚠️ Volume สูง เสี่ยง fluid overload",
                          "⚠️ ต้องรอ thaw (30-45 นาที)",
                          "⚠️ เสี่ยง TACO, TRALI",
                        ],
                      },
                    ].map(agent => (
                      <div key={agent.name} style={{
                        padding: "10px 12px", borderRadius: 10,
                        background: `${agent.color}08`, border: `1px solid ${agent.color}25`,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: agent.color, marginBottom: 4 }}>
                          {agent.icon} {agent.name}
                        </div>
                        {agent.details.map((d, i) => (
                          <div key={i} style={{ fontSize: 11, color: "#AAB8C5", lineHeight: 1.7, paddingLeft: 8 }}>
                            {d}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()}

          {!currentINR && (
            <Card style={{ marginTop: 12, textAlign: "center", padding: 20 }}>
              <span style={{ fontSize: 36 }}>🩸</span>
              <div style={{ fontSize: 13, color: "#5A7A9A", marginTop: 8 }}>ใส่ค่า INR ด้านบนเพื่อดูคำแนะนำ</div>
            </Card>
          )}
        </>)}

        {/* ═══════════ PREOP TAB ═══════════ */}
        {tab === "preop" && (<>

          {/* Thromboembolic Risk */}
          <Card>
            <Label icon="🫀" text="ความเสี่ยงลิ่มเลือด (Thromboembolic Risk)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "high", label: "🔴 สูง (High)", color: "#EF5350", items: [
                  "Mechanical mitral valve",
                  "Mechanical aortic valve + AF หรือ risk factors",
                  "Stroke/TIA/Systemic embolism ภายใน 3 เดือน",
                  "VTE ภายใน 3 เดือน",
                  "Severe thrombophilia (Protein C/S deficiency, APS)",
                ]},
                { id: "moderate", label: "🟡 ปานกลาง (Moderate)", color: "#FFC107", items: [
                  "Bileaflet aortic valve + 1 risk factor (AF, prior stroke, DM, HF, age >75)",
                  "AF with CHA₂DS₂-VASc 5-6",
                  "VTE ภายใน 3-12 เดือน",
                  "Recurrent VTE",
                  "Active cancer (ภายใน 6 เดือน)",
                ]},
                { id: "low", label: "🟢 ต่ำ (Low)", color: "#66BB6A", items: [
                  "Bileaflet aortic valve ไม่มี risk factors",
                  "AF with CHA₂DS₂-VASc 1-4",
                  "VTE >12 เดือน ไม่มี risk factors อื่น",
                ]},
              ].map(r => {
                const sel = preopRisk === r.id;
                return (
                  <button key={r.id} onClick={() => setPreopRisk(r.id)} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: `2px solid ${sel ? r.color : "rgba(255,255,255,0.06)"}`,
                    background: sel ? `${r.color}15` : "rgba(255,255,255,0.02)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#FFF" : "#8AACCA" }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: "#5A7A9A", marginTop: 3, lineHeight: 1.6 }}>
                      {r.items.map((item, i) => <span key={i}>• {item}<br /></span>)}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Bleeding Risk */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="🩹" text="ความเสี่ยงเลือดออกจากหัตถการ (Procedural Bleeding Risk)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { id: "minimal", label: "Minimal — ไม่ต้องหยุด warfarin", color: "#66BB6A", items: [
                  "ถอนฟัน (1-3 ซี่), ทันตกรรมทั่วไป",
                  "ผ่าตัดต้อกระจก, Glaucoma surgery",
                  "Skin biopsy, ตัดไฝเล็ก",
                  "Endoscopy ดูอย่างเดียว (ไม่ตัดชิ้นเนื้อ)",
                  "Cardiac device (PM/ICD) implantation",
                ]},
                { id: "low_mod", label: "Low-Moderate — หยุด warfarin", color: "#FFC107", items: [
                  "Endoscopy + biopsy/polypectomy",
                  "Cardiac catheterization",
                  "Abdominal surgery ทั่วไป (Cholecystectomy, Hernia)",
                  "Orthopedic surgery ทั่วไป",
                  "Non-cardiac thoracic surgery",
                ]},
                { id: "high", label: "High — หยุด warfarin + ระวังเป็นพิเศษ", color: "#EF5350", items: [
                  "Cardiac surgery (CABG, valve)",
                  "Craniotomy, Spinal surgery",
                  "Major cancer surgery",
                  "Joint replacement (Hip/Knee)",
                  "Kidney biopsy, Prostate surgery (TURP)",
                  "Epidural/Spinal anesthesia",
                ]},
              ].map(r => {
                const sel = bleedRisk === r.id;
                return (
                  <button key={r.id} onClick={() => setBleedRisk(r.id)} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: `2px solid ${sel ? r.color : "rgba(255,255,255,0.06)"}`,
                    background: sel ? `${r.color}15` : "rgba(255,255,255,0.02)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? "#FFF" : "#8AACCA" }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: "#5A7A9A", marginTop: 3, lineHeight: 1.6 }}>
                      {r.items.map((item, i) => <span key={i}>• {item}<br /></span>)}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ── Recommendation ── */}
          <Card style={{ marginTop: 12, background: "rgba(100,181,246,0.06)", border: "1px solid rgba(100,181,246,0.2)" }}>
            <Label icon="📋" text="แผน Perioperative Management" color="#90CAF9" />

            {/* Minimal bleed → continue warfarin */}
            {bleedRisk === "minimal" && (
              <div style={recBox("#66BB6A")}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#66BB6A", marginBottom: 6 }}>
                  ✅ ให้ Warfarin ต่อได้ — ไม่ต้องหยุด
                </div>
                <div style={{ fontSize: 12, lineHeight: 2, color: "#C0D0E0" }}>
                  • ตรวจ INR ก่อนหัตถการ ให้อยู่ใน therapeutic range<br />
                  • ถ้า INR &gt;3.0-3.5 → พิจารณาลด dose หรือเลื่อนหัตถการ<br />
                  • สำหรับถอนฟัน: ใช้ Tranexamic acid mouthwash ช่วยได้<br />
                  • ไม่ต้อง bridge
                </div>
              </div>
            )}

            {/* Low-Mod / High bleed risk */}
            {bleedRisk !== "minimal" && (
              <>
                {/* Timeline */}
                <div style={{ fontSize: 13, fontWeight: 800, color: "#90CAF9", marginBottom: 10 }}>
                  ⏱️ Timeline ก่อน-หลังผ่าตัด
                </div>

                {[
                  { day: "Day −5", label: "5 วันก่อน", action: "หยุด Warfarin", detail: "Last dose วันนี้ (เย็น)", color: "#EF5350", icon: "🛑" },
                  { day: "Day −3", label: "3 วันก่อน", action: preopRisk === "high" ? "เริ่ม Bridging LMWH" : "ไม่ต้อง bridge", detail: preopRisk === "high" ? "Enoxaparin 1 mg/kg SC q12h (therapeutic)" : "ส่วนใหญ่ไม่แนะนำ bridge — เพิ่มเสี่ยงเลือดออก", color: preopRisk === "high" ? "#FF9800" : "#66BB6A", icon: preopRisk === "high" ? "💉" : "✅" },
                  { day: "Day −2", label: "2 วันก่อน", action: "ตรวจ INR", detail: "ถ้า INR >1.5 → ให้ Vitamin K₁ 1-2 mg PO", color: "#64B5F6", icon: "🩸" },
                  { day: "Day −1", label: "1 วันก่อน", action: preopRisk === "high" ? "หยุด LMWH (last dose เช้า)" : "เตรียมผ่าตัด", detail: preopRisk === "high" ? "หยุด Enoxaparin อย่างน้อย 24 ชม. ก่อนผ่าตัด" : "ตรวจ INR ถ้ายังไม่ได้ตรวจ", color: "#FF9800", icon: preopRisk === "high" ? "⏸️" : "📋" },
                  { day: "Day 0", label: "วันผ่าตัด", action: "ตรวจ INR เช้า", detail: "เป้าหมาย INR ≤1.5 (≤1.2 สำหรับ neuraxial anesthesia)", color: "#AB47BC", icon: "🔪" },
                  { day: "Day +0/1", label: "หลังผ่าตัด 12-24 ชม.", action: "เริ่ม Warfarin กลับ", detail: "ถ้า hemostasis ดี + ทานอาหารได้ → ให้ warfarin dose เดิม (เย็นวันผ่าตัด หรือ เช้าวันรุ่งขึ้น)", color: "#66BB6A", icon: "💊" },
                  { day: "Day +1/2", label: "หลังผ่าตัด 24-48 ชม.", action: preopRisk === "high" ? "เริ่ม bridge กลับ (ถ้า hemostasis ดี)" : "ให้ warfarin ต่อ", detail: preopRisk === "high" ? (bleedRisk === "high" ? "Enoxaparin therapeutic dose 48-72 ชม. หลังผ่าตัด (high bleed risk)" : "Enoxaparin therapeutic dose 24 ชม. หลังผ่าตัด") : "ไม่ต้อง bridge — ให้ warfarin อย่างเดียว", color: preopRisk === "high" ? "#FF9800" : "#66BB6A", icon: preopRisk === "high" ? "💉" : "💊" },
                  { day: "Day +5-7", label: "5-7 วันหลังผ่าตัด", action: preopRisk === "high" ? "ตรวจ INR → หยุด bridge เมื่อ therapeutic" : "ตรวจ INR → ปรับ warfarin ตามปกติ", detail: preopRisk === "high" ? "เมื่อ INR ≥2.0 ติดต่อกัน 2 วัน → หยุด LMWH ได้" : "เป้าหมาย INR กลับเข้า therapeutic range — นัดตรวจ INR ซ้ำใน 1-2 สัปดาห์", color: "#64B5F6", icon: preopRisk === "high" ? "🎯" : "📅" },
                ].map((step, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, marginBottom: 8,
                    padding: "10px 12px", borderRadius: 10,
                    background: "rgba(255,255,255,0.02)", border: `1px solid ${step.color}20`,
                  }}>
                    <div style={{ textAlign: "center", minWidth: 50 }}>
                      <span style={{ fontSize: 20 }}>{step.icon}</span>
                      <div style={{
                        fontSize: 10, fontWeight: 800, color: step.color,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>{step.day}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#FFF" }}>{step.action}</div>
                      <div style={{ fontSize: 10, color: "#8AACCA", lineHeight: 1.6, marginTop: 2 }}>{step.detail}</div>
                    </div>
                  </div>
                ))}

                {/* Bridging decision summary */}
                <div style={{
                  marginTop: 8, padding: 12, borderRadius: 12,
                  background: preopRisk === "high" ? "rgba(239,83,80,0.08)" : "rgba(102,187,106,0.08)",
                  border: `1px solid ${preopRisk === "high" ? "rgba(239,83,80,0.25)" : "rgba(102,187,106,0.25)"}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: preopRisk === "high" ? "#EF5350" : preopRisk === "moderate" ? "#FFC107" : "#66BB6A", marginBottom: 6 }}>
                    {preopRisk === "high" ? "⚠️ แนะนำ Bridging (High thromboembolic risk)" :
                      preopRisk === "moderate" ? "⚡ พิจารณา Bridging เป็นรายๆ ไป (Moderate risk)" :
                        "✅ ไม่แนะนำ Bridge (Low thromboembolic risk)"}
                  </div>
                  <div style={{ fontSize: 11, color: "#AAB8C5", lineHeight: 1.8 }}>
                    {preopRisk === "high" && (<>
                      • <b>Enoxaparin 1 mg/kg SC q12h</b> (therapeutic dose)<br />
                      • เริ่ม Day −3, หยุด 24 ชม. ก่อนผ่าตัด<br />
                      • หลังผ่าตัด: เริ่มกลับ {bleedRisk === "high" ? "48-72 ชม." : "24 ชม."} หลังผ่าตัด<br />
                      • ถ้า CrCl &lt;30 → ใช้ UFH IV แทน LMWH<br />
                      • หยุด bridge เมื่อ INR therapeutic ≥2 วัน
                    </>)}
                    {preopRisk === "moderate" && (<>
                      • หลักฐานไม่ชัดเจนว่า bridge ดีกว่าไม่ bridge<br />
                      • Bridge เพิ่มเสี่ยง major bleeding 2-4 เท่า<br />
                      • พิจารณาเป็นรายบุคคล: ถ้าเคยมี stroke/TE ขณะหยุดยา → อาจ bridge<br />
                      • ถ้าตัดสินใจ bridge → ใช้ <b>Enoxaparin prophylactic dose</b> อาจเพียงพอ<br />
                      • แนวทาง CHEST 2022: ส่วนใหญ่ <b>ไม่แนะนำ bridge</b> ใน moderate risk
                    </>)}
                    {preopRisk === "low" && (<>
                      • ความเสี่ยงลิ่มเลือดต่ำ — bridge เพิ่มเสี่ยงเลือดออกโดยไม่มีประโยชน์<br />
                      • หยุด warfarin 5 วัน → ผ่าตัด → เริ่ม warfarin กลับ 12-24 ชม. หลัง<br />
                      • <b>ไม่ต้อง bridge</b> (CHEST 2022 Strong recommendation)
                    </>)}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* LMWH Dosing Reference */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="💉" text="LMWH Bridging Dosing Reference" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Therapeutic dose", dose: "Enoxaparin 1 mg/kg SC q12h", note: "สำหรับ high thromboembolic risk • หยุด 24 ชม. ก่อนผ่าตัด", color: "#EF5350" },
                { label: "Prophylactic dose", dose: "Enoxaparin 40 mg SC OD", note: "อาจใช้ใน moderate risk แทน therapeutic • หยุด 12 ชม. ก่อนผ่าตัด", color: "#FFC107" },
                { label: "CrCl <30 mL/min", dose: "UFH IV drip (aPTT 1.5-2.5x)", note: "หลีกเลี่ยง LMWH ในไตบกพร่อง • หยุด UFH 4-6 ชม. ก่อนผ่าตัด", color: "#64B5F6" },
                { label: "อายุ ≥75 ปี", dose: "Enoxaparin ปรับ: ปัดลงเป็น syringe size ใกล้สุด", note: "ลดเสี่ยงเลือดออก • พิจารณาใช้ prophylactic dose แทน", color: "#AB47BC" },
              ].map(d => (
                <div key={d.label} style={{
                  padding: "8px 12px", borderRadius: 10,
                  background: `${d.color}08`, border: `1px solid ${d.color}20`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FFF", marginTop: 2 }}>{d.dose}</div>
                  <div style={{ fontSize: 10, color: "#6A8AAB", marginTop: 2 }}>{d.note}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Points */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="📌" text="จุดสำคัญ" />
            <div style={{ fontSize: 11, color: "#AAB8C5", lineHeight: 2 }}>
              <b style={{ color: "#EF5350" }}>⚡ หลักการใหม่ (CHEST 2022):</b><br />
              • Bridge <b>เพิ่มเสี่ยง major bleeding 2-4 เท่า</b> โดยไม่ลด thromboembolism ในคนส่วนใหญ่<br />
              • Bridge เฉพาะ <b>high thromboembolic risk</b> เท่านั้น<br />
              • AF ส่วนใหญ่ <b>ไม่ต้อง bridge</b> (BRIDGE trial, NEJM 2015)<br />
              <br />
              <b style={{ color: "#64B5F6" }}>📋 Minor procedures ที่ไม่ต้องหยุด warfarin:</b><br />
              • ถอนฟัน, ทำฟัน, ผ่าตัดต้อกระจก, Skin biopsy<br />
              • Endoscopy ดูอย่างเดียว, PM/ICD implant<br />
              <br />
              <b style={{ color: "#FF9800" }}>🔄 Neuraxial anesthesia:</b><br />
              • ต้อง INR ≤1.2 ก่อนทำ epidural/spinal<br />
              • หยุด LMWH therapeutic ≥24 ชม. ก่อน<br />
              • หลังถอด epidural catheter: รอ ≥4 ชม. ก่อนให้ LMWH กลับ
            </div>
          </Card>
        </>)}

        {tab === "interact" && (<>

          {/* Search */}
          <Card>
            <Label icon="🔍" text="ค้นหายาที่ใช้ร่วมกับ Warfarin" />
            <input
              type="text" value={drugSearch}
              onChange={e => setDrugSearch(e.target.value)}
              placeholder="พิมพ์ชื่อยา เช่น amiodarone, omeprazole, แอสไพริน..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                color: "#FFF", fontFamily: "inherit", fontSize: 14,
                outline: "none",
              }}
            />

            {/* Search results */}
            {drugSearch.trim() && (
              <div style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}>
                {filteredDrugs.length === 0 ? (
                  <div style={{ padding: 12, textAlign: "center", color: "#5A7A9A", fontSize: 13 }}>
                    ไม่พบยา "{drugSearch}" — ลองพิมพ์ชื่อสามัญ/ชื่อการค้า
                  </div>
                ) : (
                  filteredDrugs.map(drug => {
                    const isSelected = selectedDrugs.some(d => d.generic === drug.generic);
                    const effColor = drug.effect === "increase" ? "#EF5350" :
                      drug.effect === "decrease" ? "#FF9800" :
                        drug.effect === "bleeding" ? "#E040FB" : "#66BB6A";
                    return (
                      <button key={drug.generic} onClick={() => toggleDrug(drug)} style={{
                        width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: 4,
                        borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        border: `1px solid ${isSelected ? effColor : "rgba(255,255,255,0.06)"}`,
                        background: isSelected ? `${effColor}15` : "rgba(255,255,255,0.02)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                          background: effColor,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#E0E8F0" }}>
                            {drug.generic}
                            <span style={{ fontWeight: 400, color: "#6A8AAB", marginLeft: 6, fontSize: 11 }}>
                              ({drug.brand})
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#5A7A9A" }}>{drug.thaiName} • {drug.category}</div>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
                          background: `${effColor}25`, color: effColor, whiteSpace: "nowrap",
                        }}>
                          {drug.effect === "increase" ? "↑ INR" :
                            drug.effect === "decrease" ? "↓ INR" :
                              drug.effect === "bleeding" ? "⚡ เลือดออก" : "✓ ปลอดภัย"}
                        </span>
                        {isSelected && <span style={{ fontSize: 14 }}>✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </Card>

          {/* Selected Drugs Summary */}
          {selectedDrugs.length > 0 && (
            <Card style={{ marginTop: 12 }}>
              <Label icon="📋" text={`ยาที่เลือก (${selectedDrugs.length} รายการ)`} />

              {/* Overall recommendation */}
              {(() => {
                const hasIncrease = selectedDrugs.some(d => d.effect === "increase");
                const hasDecrease = selectedDrugs.some(d => d.effect === "decrease");
                const hasBleeding = selectedDrugs.some(d => d.effect === "bleeding");
                const hasSevere = selectedDrugs.some(d => d.severity === "severe");

                return (
                  <div style={{
                    padding: 14, borderRadius: 12, marginBottom: 14,
                    background: hasSevere
                      ? "linear-gradient(135deg, rgba(239,83,80,0.15), rgba(239,83,80,0.05))"
                      : "linear-gradient(135deg, rgba(255,193,7,0.1), rgba(255,193,7,0.03))",
                    border: `1px solid ${hasSevere ? "rgba(239,83,80,0.3)" : "rgba(255,193,7,0.25)"}`,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: hasSevere ? "#EF5350" : "#FFD54F" }}>
                      {hasSevere ? "⚠️ พบ INTERACTION ระดับรุนแรง" : "⚡ พบ Drug Interaction"}
                    </div>
                    <div style={{ fontSize: 12, color: "#C0D0E0", lineHeight: 1.8 }}>
                      {hasIncrease && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>🔴</span>
                          <span><b style={{ color: "#EF5350" }}>INR เพิ่ม</b> → อาจต้อง<b>ลด warfarin</b>, เสี่ยงเลือดออก</span>
                        </div>
                      )}
                      {hasDecrease && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>🟠</span>
                          <span><b style={{ color: "#FF9800" }}>INR ลด</b> → อาจต้อง<b>เพิ่ม warfarin</b>, เสี่ยงลิ่มเลือด</span>
                        </div>
                      )}
                      {hasBleeding && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 20 }}>🟣</span>
                          <span><b style={{ color: "#E040FB" }}>เพิ่มความเสี่ยงเลือดออก</b> แม้ INR ไม่เปลี่ยน</span>
                        </div>
                      )}
                      {hasIncrease && hasDecrease && (
                        <div style={{
                          marginTop: 6, padding: "6px 10px", borderRadius: 8,
                          background: "rgba(255,255,255,0.06)", fontSize: 11, color: "#FFD54F",
                        }}>
                          ⚠️ มียาทั้งเพิ่มและลด INR — ผลรวมคาดเดาได้ยาก ต้องตรวจ INR ถี่ขึ้น
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Individual drug details */}
              {selectedDrugs.map(drug => {
                const effColor = drug.effect === "increase" ? "#EF5350" :
                  drug.effect === "decrease" ? "#FF9800" :
                    drug.effect === "bleeding" ? "#E040FB" : "#66BB6A";
                const sevBg = drug.severity === "severe" ? "rgba(239,83,80,0.12)" :
                  drug.severity === "moderate" ? "rgba(255,193,7,0.08)" : "rgba(255,255,255,0.03)";
                return (
                  <div key={drug.generic} style={{
                    padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                    background: sevBg,
                    border: `1px solid ${effColor}30`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#FFF" }}>
                          {drug.generic}
                          <span style={{ fontWeight: 400, color: "#6A8AAB", marginLeft: 6, fontSize: 11 }}>
                            ({drug.brand})
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#5A7A9A" }}>{drug.thaiName} • {drug.category}</div>
                      </div>
                      <button onClick={() => toggleDrug(drug)} style={{
                        background: "none", border: "none", color: "#5A7A9A", cursor: "pointer",
                        fontSize: 16, padding: 4,
                      }}>✕</button>
                    </div>

                    {/* Effect badge */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: `${effColor}25`, color: effColor,
                      }}>
                        {drug.effect === "increase" ? "↑ เพิ่ม INR → ลด warfarin" :
                          drug.effect === "decrease" ? "↓ ลด INR → เพิ่ม warfarin" :
                            drug.effect === "bleeding" ? "⚡ เพิ่มเสี่ยงเลือดออก" : "✓ ปลอดภัย"}
                      </span>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: drug.severity === "severe" ? "rgba(239,83,80,0.2)" :
                          drug.severity === "moderate" ? "rgba(255,193,7,0.15)" : "rgba(255,255,255,0.08)",
                        color: drug.severity === "severe" ? "#EF5350" :
                          drug.severity === "moderate" ? "#FFC107" : "#81C784",
                      }}>
                        {drug.severity === "severe" ? "รุนแรง" :
                          drug.severity === "moderate" ? "ปานกลาง" :
                            drug.severity === "mild" ? "เล็กน้อย" : "ไม่มี"}
                      </span>
                    </div>

                    {/* Details */}
                    <div style={{ fontSize: 11, lineHeight: 1.8, color: "#AAB8C5" }}>
                      <div><b style={{ color: "#90CAF9" }}>💊 คำแนะนำ:</b> <span style={{ color: "#FFF" }}>{drug.adjust}</span></div>
                      <div><b style={{ color: "#90CAF9" }}>⚙️ กลไก:</b> {drug.mechanism}</div>
                      <div><b style={{ color: "#90CAF9" }}>⏱️ ระยะเกิดผล:</b> {drug.onset}</div>
                      {drug.note && <div><b style={{ color: "#90CAF9" }}>📝 หมายเหตุ:</b> <span style={{ color: "#FFD54F" }}>{drug.note}</span></div>}
                    </div>
                  </div>
                );
              })}

              {/* Clear all */}
              <button onClick={() => setSelectedDrugs([])} style={{
                width: "100%", padding: "8px", borderRadius: 10, border: "none",
                background: "rgba(239,83,80,0.1)", color: "#EF9A9A",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                marginTop: 4,
              }}>🗑️ ล้างรายการทั้งหมด</button>
            </Card>
          )}

          {/* Quick reference: Category browse */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="📚" text="ดูตามกลุ่มยา" />
            {(() => {
              const categories = {};
              DRUG_INTERACTIONS.forEach(d => {
                if (!categories[d.category]) categories[d.category] = [];
                categories[d.category].push(d);
              });
              return Object.entries(categories).map(([cat, drugs]) => (
                <details key={cat} style={{ marginBottom: 4 }}>
                  <summary style={{
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", fontSize: 13, fontWeight: 600,
                    color: "#90CAF9", listStyle: "none",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ fontSize: 10, color: "#4A5A6A" }}>▸</span>
                    {cat}
                    <span style={{ fontSize: 10, color: "#5A7A9A", fontWeight: 400 }}>({drugs.length})</span>
                  </summary>
                  <div style={{ padding: "4px 0 4px 16px" }}>
                    {drugs.map(drug => {
                      const effColor = drug.effect === "increase" ? "#EF5350" :
                        drug.effect === "decrease" ? "#FF9800" :
                          drug.effect === "bleeding" ? "#E040FB" : "#66BB6A";
                      const isSelected = selectedDrugs.some(d => d.generic === drug.generic);
                      return (
                        <button key={drug.generic} onClick={() => toggleDrug(drug)} style={{
                          display: "flex", alignItems: "center", gap: 6, width: "100%",
                          textAlign: "left", padding: "5px 8px", marginBottom: 2, borderRadius: 6,
                          border: isSelected ? `1px solid ${effColor}` : "1px solid transparent",
                          background: isSelected ? `${effColor}10` : "transparent",
                          fontFamily: "inherit", cursor: "pointer",
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: effColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#C0D0E0", flex: 1 }}>
                            {drug.generic} <span style={{ color: "#5A7A9A" }}>({drug.thaiName})</span>
                          </span>
                          <span style={{ fontSize: 9, color: effColor, fontWeight: 700 }}>
                            {drug.effect === "increase" ? "↑INR" :
                              drug.effect === "decrease" ? "↓INR" :
                                drug.effect === "bleeding" ? "⚡bleed" : "✓safe"}
                          </span>
                          {isSelected && <span style={{ fontSize: 11 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </details>
              ));
            })()}
          </Card>

          {/* Legend */}
          <Card style={{ marginTop: 12 }}>
            <Label icon="🏷️" text="คำอธิบายสัญลักษณ์" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
              {[
                { color: "#EF5350", icon: "🔴", label: "↑ INR เพิ่ม → ต้องลด warfarin (เสี่ยงเลือดออก)" },
                { color: "#FF9800", icon: "🟠", label: "↓ INR ลด → ต้องเพิ่ม warfarin (เสี่ยงลิ่มเลือด)" },
                { color: "#E040FB", icon: "🟣", label: "⚡ เพิ่มเสี่ยงเลือดออก (INR อาจไม่เปลี่ยน)" },
                { color: "#66BB6A", icon: "🟢", label: "✓ ปลอดภัย / interaction น้อยมาก" },
              ].map(item => (
                <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 8, color: "#AAB8C5" }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, fontSize: 10, color: "#5A7A9A", lineHeight: 1.6 }}>
                <b>FAB-4:</b> ยา 4 ตัวที่ interaction แรงที่สุดกับ warfarin = <b style={{ color: "#EF5350" }}>Fluconazole, Amiodarone, Bactrim (TMP-SMX), Flagyl (Metronidazole)</b>
              </div>
            </div>
          </Card>
        </>)}
        <div style={{
          marginTop: 14, padding: 11, borderRadius: 12,
          background: "rgba(255,193,7,0.06)", border: "1px solid rgba(255,193,7,0.18)",
          fontSize: 10, color: "#FFD54F", lineHeight: 1.6,
        }}>
          ⚠️ <b>หมายเหตุ:</b> เครื่องมือช่วยคำนวณเท่านั้น การปรับยา warfarin ต้องอยู่ภายใต้ดุลยพินิจของแพทย์ ร่วมกับผล INR และปัจจัยทางคลินิก •
          แผนที่แนะนำจะเรียง dose ที่ <b>สม่ำเสมอ (gap น้อย)</b> ขึ้นก่อน เพื่อระดับยาในเลือดคงที่ •
          การจัดการ warfarin ก่อนผ่าตัด (Pre-op) ขึ้นกับ<b>ดุลยพินิจของแพทย์ผู้ผ่าตัด วิสัญญีแพทย์ และปัจจัยเฉพาะของผู้ป่วยแต่ละราย</b> ควรปรึกษาทีมผ่าตัดร่วมกันก่อนตัดสินใจเสมอ
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */
function recBox(c) {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 6,
    background: c + "10",
    border: "1px solid " + c + "30",
    fontSize: 12,
    color: "#E0E8F0",
    lineHeight: 2,
  };
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.035)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "12px 14px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Label({ icon, text, color }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: color || "#7EB3DB",
      marginBottom: 8, letterSpacing: .6, textTransform: "uppercase",
    }}>{icon} {text}</div>
  );
}

// Real warfarin colors
const PILL_COLORS = {
  1: { fill: "#E8E8E8", stroke: "#BDBDBD", text: "#555", label: "ขาว" },
  2: { fill: "#FF9D2E", stroke: "#E07B00", text: "#6B3400", label: "ส้ม" },
  3: { fill: "#5A9CF5", stroke: "#3574D4", text: "#1A3A6B", label: "ฟ้า" },
  4: { fill: "#FFE14D", stroke: "#D4B800", text: "#6B5F00", label: "เหลือง" },
  5: { fill: "#F06292", stroke: "#D81B60", text: "#6B0030", label: "ชมพู" },
};

function PillDot({ mg, on }) {
  const c = PILL_COLORS[mg] || PILL_COLORS[3];
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ display: "block", margin: "0 auto" }}>
      {/* Pill shape - rounded rectangle */}
      <rect x="4" y="6" width="24" height="20" rx="10" ry="10"
        fill={on ? c.fill : "#2A3444"} stroke={on ? c.stroke : "#3A4A5A"} strokeWidth="2" />
      {/* Score line */}
      <line x1="16" y1="8" x2="16" y2="24" stroke={on ? c.stroke : "#3A4A5A"} strokeWidth="1" opacity="0.5" />
      {/* mg text */}
      <text x="16" y="19" textAnchor="middle" fontSize="9" fontWeight="800"
        fontFamily="'JetBrains Mono', monospace"
        fill={on ? c.text : "#4A5A6A"}>{mg}</text>
    </svg>
  );
}

function PillIcon({ mg, half, size = 22 }) {
  const c = PILL_COLORS[mg] || PILL_COLORS[3];
  const w = half ? size * 0.6 : size;
  const h = size;
  return (
    <svg width={w} height={h} viewBox={half ? "0 0 14 22" : "0 0 22 22"} style={{ display: "inline-block", verticalAlign: "middle" }}>
      {half ? (
        <>
          {/* Half pill - left half */}
          <path d="M11,2 Q2,2 2,11 Q2,20 11,20 L11,2 Z"
            fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
          {/* Dashed edge to show it's cut */}
          <line x1="11" y1="2" x2="11" y2="20" stroke={c.stroke} strokeWidth="1" strokeDasharray="2,2" />
          <text x="7" y="14" textAnchor="middle" fontSize="6" fontWeight="800"
            fontFamily="'JetBrains Mono', monospace" fill={c.text}>½</text>
        </>
      ) : (
        <>
          <rect x="2" y="2" width="18" height="18" rx="9" ry="9"
            fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
          <line x1="11" y1="3" x2="11" y2="19" stroke={c.stroke} strokeWidth="0.7" opacity="0.4" />
          <text x="11" y="14" textAnchor="middle" fontSize="7" fontWeight="800"
            fontFamily="'JetBrains Mono', monospace" fill={c.text}>{mg}</text>
        </>
      )}
    </svg>
  );
}

function PillComboVisual({ combo }) {
  if (!combo.possible) return <span style={{ fontSize: 11, color: "#EF5350" }}>❌</span>;
  if (combo.parts.length === 0) return <span style={{ fontSize: 11, color: "#5A7A9A" }}>— หยุดยา</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
      {combo.parts.map((p, pi) => (
        <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          {pi > 0 && <span style={{ color: "#4A5A6A", fontSize: 10, margin: "0 2px" }}>+</span>}
          {Array.from({ length: p.n }).map((_, qi) => (
            <PillIcon key={qi} mg={p.mg} half={p.half} size={20} />
          ))}
        </span>
      ))}
    </span>
  );
}

function PillComboText({ combo }) {
  if (!combo.possible) return "❌ จัดไม่ได้";
  if (combo.parts.length === 0) return "— หยุดยา";
  const c = PILL_COLORS;
  return combo.parts.map(p => {
    const col = c[p.mg] || c[3];
    return p.half
      ? `½×${p.mg}mg(${col.label}) ×${p.n}`
      : `${p.mg}mg(${col.label}) ×${p.n}`;
  }).join(" + ");
}

function StepBtn({ label, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      width: small ? 32 : 40, height: small ? 32 : 40, borderRadius: 10, border: "none",
      background: small ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
      color: "#90CAF9", fontSize: small ? 14 : 18, fontWeight: 700, cursor: "pointer",
      fontFamily: "'JetBrains Mono', monospace",
    }}>{label}</button>
  );
}
