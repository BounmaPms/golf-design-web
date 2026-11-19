/*
  ตั้งค่า Cloudinary ของคุณที่นี่
  1) CLOUD_NAME: ดูจากหน้า Dashboard ของ Cloudinary
  2) UPLOAD_PRESET: สร้าง Upload Preset แบบ Unsigned
*/
window.CLOUDINARY_CONFIG = {
  cloudName: "ruvtg4ki",

  // URL ของ Worker ตัวใหม่สำหรับสร้างลายเซ็น
  signApiUrl: "golf-design-upload-sign.bounmastudent01.workers.dev",

  // Worker ลบรูปตัวเดิม
  deleteApiUrl:
    "https://golf-design-delete.bounmastudent01.workers.dev",
};