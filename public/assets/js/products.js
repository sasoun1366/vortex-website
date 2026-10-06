/* ==========================================================================
   VORTEX — Product data & site config
   --------------------------------------------------------------------------
   این فایل رو برای تغییر محصولات، قیمت‌ها و راه‌های ارتباطی ویرایش کنید.
   You only need to touch this file to update products, prices and contacts.
   ========================================================================== */

const VORTEX = {

  /* ------------------------------------------------------------------
     ۱) تنظیمات سایت  —  SITE CONFIG
        شماره واتساپ باید با کد کشور و بدون + و بدون ۰ باشد: 98912...
     ------------------------------------------------------------------ */
  config: {
    whatsapp : "989120000000",          // ← شماره واتساپ فروشگاه (placeholder)
    telegram : "VortexGearBot",         // ← یوزرنیم بات تلگرام بدون @
    instagram: "vortex.gear",           // ← پیج اینستاگرام بدون @
    email    : "order@vortex.gear",
    phone    : "+98 912 000 0000",
    address  : { fa: "ایران — ارسال به سراسر کشور", en: "Iran — shipping nationwide" },
    hours    : { fa: "شنبه تا پنجشنبه • ۱۰:۰۰ تا ۲۰:۰۰", en: "Sat–Thu • 10:00 – 20:00" },

    currency : { fa: "تومان", en: "Toman" },
    shippingCost     : 180000,          // هزینه ارسال (۰ = رایگان)
    freeShipOver     : 3000000,         // ارسال رایگان از این مبلغ به بالا
    brandTag : { fa: "ساخته‌شده برای شدت", en: "Built for intensity" }
  },

  /* ------------------------------------------------------------------
     ۲) دسته‌بندی‌ها  —  CATEGORIES
     ------------------------------------------------------------------ */
  categories: [
    { id: "all",       fa: "همه",            en: "All" },
    { id: "apparel",   fa: "پوشاک",          en: "Apparel" },
    { id: "accessory", fa: "اکسسوری",        en: "Accessories" },
    { id: "gear",      fa: "تجهیزات تمرین",  en: "Training gear" }
  ],

  /* ------------------------------------------------------------------
     ۳) محصولات  —  PRODUCTS
        price / oldPrice → عدد خالص بدون کاما (تومان). oldPrice خالی = بدون تخفیف
        sizes → اگر محصول سایز دارد بنویسید، وگرنه [] بگذارید
     ------------------------------------------------------------------ */
  products: [
    {
      id: "vx-tee-001",
      cat: "apparel",
      img: "assets/img/tee.jpg",
      price: 1480000,
      oldPrice: 1850000,
      featured: true,
      badge: { fa: "پرفروش", en: "Best seller" },
      name: { fa: "تی‌شرت تمرین ورتکس", en: "Vortex Performance Tee" },
      desc: {
        fa: "پارچه سنگین‌وزن و خنک، دوخت تخت و مقاوم. لوگوی ورتکس روی سینه و لیبل پارچه‌ای روی دامن.",
        en: "Heavyweight, breathable fabric with flat-lock stitching. Vortex chest mark and woven hem label."
      },
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    {
      id: "vx-crop-001",
      cat: "apparel",
      img: "assets/img/crop-tee.jpg",
      price: 1250000,
      oldPrice: 0,
      featured: true,
      badge: { fa: "کالکشن محدود", en: "Limited drop" },
      name: { fa: "تی‌شرت کراپ «فصل ۰۱ / شماره ۶»", en: "Crop Tee — Season 01 · Issue No.6" },
      desc: {
        fa: "برش کراپ با چاپ خط‌اطمینان‌شده‌ی «Season 01 — Issue No.6». تعداد محدود.",
        en: "Cropped cut with the handwritten “Season 01 — Issue No.6” print. Limited quantity."
      },
      sizes: ["S", "M", "L"]
    },
    {
      id: "vx-wrap-001",
      cat: "gear",
      img: "assets/img/wrist-wraps.jpg",
      price: 690000,
      oldPrice: 0,
      featured: true,
      badge: { fa: "جدید", en: "New" },
      name: { fa: "مچ‌بند تمرین ورتکس", en: "Vortex Wrist Wraps" },
      desc: {
        fa: "کشی مقاوم با دوخت محکم و لیبل ورتکس — ثبات مچ در هالتر، پرس و کارهای سنگین.",
        en: "Stiff, durable elastic with reinforced stitching and a Vortex patch — wrist stability on heavy lifts."
      },
      sizes: ["30cm", "45cm"]
    },
    {
      id: "vx-chalk-001",
      cat: "gear",
      img: "assets/img/liquid-chalk.jpg",
      price: 480000,
      oldPrice: 0,
      featured: true,
      badge: { fa: "", en: "" },
      name: { fa: "گچ مایع ورتکس — ۱۵۰ میلی‌لیتر", en: "Vortex Liquid Chalk — 150 ml" },
      desc: {
        fa: "گیرِ خشک و بدون پودر، سریع خشک می‌شود و کف دست را برای هالتر و بارفیکس آماده می‌کند.",
        en: "Dry, chalk-free grip that dries fast and gets your hands ready for the bar and the pull-up rig."
      },
      sizes: []
    },
    {
      id: "vx-key-001",
      cat: "accessory",
      img: "assets/img/keychain.jpg",
      price: 320000,
      oldPrice: 0,
      featured: true,
      badge: { fa: "", en: "" },
      name: { fa: "جاکلیدی و بند ورتکس", en: "Vortex Key Strap" },
      desc: {
        fa: "بند تسمه‌ای با قفل فلزی و لیبل گلدوزی‌شده ورتکس — مناسب کلید، کیسه و قفل کمد باکس.",
        en: "Webbing strap with a metal clip and embroidered Vortex patch — for keys, kit bag and locker."
      },
      sizes: []
    }
  ],

  /* ------------------------------------------------------------------
     ۴) محصولات به‌زودی  —  COMING SOON tiles
     ------------------------------------------------------------------ */
  soon: [
    { fa: "استرپ لیفت ورتکس", en: "Vortex Lifting Straps" },
    { fa: "کمربند وزنه‌برداری ورتکس", en: "Vortex Lifting Belt" },
    { fa: "کیسه تمرین ورتکس", en: "Vortex Gym Bag" }
  ]
};
