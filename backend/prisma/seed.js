const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data and seeding clean UniMarket database without any mock/fake products...');

  // Clear all existing data
  await prisma.adminLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.university.deleteMany();

  // 1. Standard Universities
  const universitiesData = [
    { name: 'Đại học Bách Khoa Hà Nội', shortName: 'HUST', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Kinh tế Quốc dân', shortName: 'NEU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Quốc gia Hà Nội', shortName: 'VNU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Ngoại thương', shortName: 'FTU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Thương mại', shortName: 'TMU', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Công nghệ Bưu chính Viễn thông', shortName: 'PTIT', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Bách Khoa TP.HCM', shortName: 'HCMUT', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Công nghệ Thông tin - ĐHQG TP.HCM', shortName: 'UIT', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Sư phạm Kỹ thuật TP.HCM', shortName: 'HCMUTE', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Bách Khoa - ĐH Đà Nẵng', shortName: 'DUT', city: 'Đà Nẵng', isPopular: false },
  ];

  for (const u of universitiesData) {
    await prisma.university.create({ data: u });
  }

  // 2. Standard Categories
  const categoriesData = [
    { name: 'Sách & Giáo trình', slug: 'sach-giao-trinh', icon: '📚' },
    { name: 'Đồ điện tử', slug: 'dien-tu', icon: '💻' },
    { name: 'Đồ phòng trọ', slug: 'do-phong-tro', icon: '🪑' },
    { name: 'Thời trang', slug: 'thoi-trang', icon: '👕' },
    { name: 'Phương tiện', slug: 'phuong-tien', icon: '🏍️' },
    { name: 'Giải trí & Thể thao', slug: 'giai-tri', icon: '🎮' },
    { name: 'Cho tặng 0đ', slug: 'cho-tang-0d', icon: '📦' },
  ];

  const createdCats = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.create({ data: c });
    createdCats[c.slug] = cat;
  }

  // Subcategories
  const subCategoriesData = [
    { name: 'Giáo trình Bách Khoa / NEU', slug: 'giao-trinh-chuyen-nganh', parentId: createdCats['sach-giao-trinh'].id },
    { name: 'Sách ngoại ngữ & TOEIC/IELTS', slug: 'sach-ngoai-ngu', parentId: createdCats['sach-giao-trinh'].id },
    { name: 'Laptop & PC sinh viên', slug: 'laptop-pc', parentId: createdCats['dien-tu'].id },
    { name: 'Điện thoại & Tablet', slug: 'dien-thoai-tablet', parentId: createdCats['dien-tu'].id },
    { name: 'Bàn phím, Chuột & Phụ kiện', slug: 'chuot-ban-phim', parentId: createdCats['dien-tu'].id },
    { name: 'Bàn ghế học tập', slug: 'ban-ghe', parentId: createdCats['do-phong-tro'].id },
    { name: 'Quạt & Đồ gia dụng trọ', slug: 'quat-do-gia-dung', parentId: createdCats['do-phong-tro'].id },
    { name: 'Xe đạp & Xe máy', slug: 'xe-dap-xe-may', parentId: createdCats['phuong-tien'].id },
  ];

  for (const sc of subCategoriesData) {
    await prisma.category.create({ data: sc });
  }

  // 3. Admin Account Only (Strictly user-requested credentials)
  // username: NguyenNamHai, password: Plan_Me22, email: nguyennamhaibusiness@gmail.com
  const adminPassword = await bcrypt.hash('Plan_Me22', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'NguyenNamHai',
      email: 'nguyennamhaibusiness@gmail.com',
      password: adminPassword,
      fullName: 'Nguyễn Nam Hải',
      role: 'ADMIN',
      city: 'Hà Nội',
      district: 'Cầu Giấy',
      bio: 'Quản trị viên UniMarket',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      zalo: '0987654321',
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com'
    }
  });

  // Log system initialization
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'SYSTEM_INIT',
      targetType: 'SYSTEM',
      targetId: 'root',
      details: 'Khởi tạo hệ thống UniMarket thành công. Tài khoản Quản trị viên: NguyenNamHai',
    }
  });

  console.log('Seeding completed! Database is clean without mock products/users.');
  console.log('Admin credentials:');
  console.log('Username: NguyenNamHai');
  console.log('Email: nguyennamhaibusiness@gmail.com');
  console.log('Password: Plan_Me22');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });