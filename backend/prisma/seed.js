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

  // 1. Comprehensive list of Universities across Vietnam
  const universitiesData = [
    // --- Hà Nội ---
    { name: 'Đại học Bách Khoa Hà Nội', shortName: 'HUST', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Kinh tế Quốc dân', shortName: 'NEU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Quốc gia Hà Nội', shortName: 'VNU', city: 'Hà Nội', isPopular: true },
    { name: 'Trường ĐH Công nghệ - ĐHQGHN', shortName: 'VNU-UET', city: 'Hà Nội', isPopular: true },
    { name: 'Trường ĐH Khoa học Tự nhiên - ĐHQGHN', shortName: 'VNU-HUS', city: 'Hà Nội', isPopular: false },
    { name: 'Trường ĐH Khoa học Xã hội & Nhân văn - ĐHQGHN', shortName: 'VNU-USSH', city: 'Hà Nội', isPopular: false },
    { name: 'Trường ĐH Ngoại ngữ - ĐHQGHN', shortName: 'VNU-ULIS', city: 'Hà Nội', isPopular: true },
    { name: 'Trường ĐH Kinh tế - ĐHQGHN', shortName: 'VNU-UEB', city: 'Hà Nội', isPopular: false },
    { name: 'Trường ĐH Luật - ĐHQGHN', shortName: 'VNU-UL', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Ngoại thương', shortName: 'FTU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Thương mại', shortName: 'TMU', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Công nghệ Bưu chính Viễn thông', shortName: 'PTIT', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Tài chính', shortName: 'AOF', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Ngân hàng', shortName: 'BA', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Báo chí và Tuyên truyền', shortName: 'AJC', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Ngoại giao', shortName: 'DAV', city: 'Hà Nội', isPopular: true },
    { name: 'Học viện Nông nghiệp Việt Nam', shortName: 'VNUA', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Xây dựng Hà Nội', shortName: 'HUCE', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Kiến trúc Hà Nội', shortName: 'HAU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Giao thông Vận tải', shortName: 'UTC', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Sư phạm Hà Nội', shortName: 'HNUE', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Công nghiệp Hà Nội', shortName: 'HaUI', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Mỏ - Địa chất', shortName: 'HUMG', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Y Hà Nội', shortName: 'HMU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Dược Hà Nội', shortName: 'HUP', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Luật Hà Nội', shortName: 'HLU', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Thăng Long', shortName: 'TLU', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Kinh doanh và Công nghệ Hà Nội', shortName: 'HUBT', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học FPT Hà Nội', shortName: 'FPT-HN', city: 'Hà Nội', isPopular: true },
    { name: 'Đại học Phenikaa', shortName: 'PHENIKAA', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Điện lực', shortName: 'EPU', city: 'Hà Nội', isPopular: false },
    { name: 'Đại học Mở Hà Nội', shortName: 'HOU', city: 'Hà Nội', isPopular: false },

    // --- TP. Hồ Chí Minh ---
    { name: 'Đại học Bách Khoa - ĐHQG TP.HCM', shortName: 'HCMUT', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Công nghệ Thông tin - ĐHQG TP.HCM', shortName: 'UIT', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Khoa học Tự nhiên - ĐHQG TP.HCM', shortName: 'HCMUS', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Khoa học Xã hội & Nhân văn - ĐHQG TP.HCM', shortName: 'USSH-HCM', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Quốc tế - ĐHQG TP.HCM', shortName: 'IU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Kinh tế - Luật - ĐHQG TP.HCM', shortName: 'UEL', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Kinh tế TP.HCM', shortName: 'UEH', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Ngoại thương Cơ sở 2', shortName: 'FTU-CS2', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Sư phạm Kỹ thuật TP.HCM', shortName: 'HCMUTE', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Kiến trúc TP.HCM', shortName: 'UAH', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Sư phạm TP.HCM', shortName: 'HCMUE', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Sài Gòn', shortName: 'SGU', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Tôn Đức Thắng', shortName: 'TDTU', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Công nghệ TP.HCM', shortName: 'HUTECH', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Văn Lang', shortName: 'VLU', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Hoa Sen', shortName: 'HSU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Tài chính - Marketing', shortName: 'UFM', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Mở TP.HCM', shortName: 'OU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Y Dược TP.HCM', shortName: 'UMP', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Y khoa Phạm Ngọc Thạch', shortName: 'PNTU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Luật TP.HCM', shortName: 'ULAW', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học Nông Lâm TP.HCM', shortName: 'NLU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Công Thương TP.HCM', shortName: 'HUIT', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học Nguyễn Tất Thành', shortName: 'NTTU', city: 'TP.HCM', isPopular: false },
    { name: 'Đại học RMIT Việt Nam', shortName: 'RMIT', city: 'TP.HCM', isPopular: true },
    { name: 'Đại học FPT TP.HCM', shortName: 'FPT-HCM', city: 'TP.HCM', isPopular: true },

    // --- Đà Nẵng & Miền Trung ---
    { name: 'Đại học Bách Khoa - ĐH Đà Nẵng', shortName: 'DUT', city: 'Đà Nẵng', isPopular: true },
    { name: 'Đại học Kinh tế - ĐH Đà Nẵng', shortName: 'DUE', city: 'Đà Nẵng', isPopular: true },
    { name: 'Đại học Sư phạm - ĐH Đà Nẵng', shortName: 'UED', city: 'Đà Nẵng', isPopular: false },
    { name: 'Đại học Ngoại ngữ - ĐH Đà Nẵng', shortName: 'UFL', city: 'Đà Nẵng', isPopular: false },
    { name: 'Đại học CNTT & Truyền thông Việt - Hàn', shortName: 'VKU', city: 'Đà Nẵng', isPopular: true },
    { name: 'Đại học Duy Tân', shortName: 'DTU', city: 'Đà Nẵng', isPopular: true },
    { name: 'Đại học FPT Đà Nẵng', shortName: 'FPT-DN', city: 'Đà Nẵng', isPopular: false },
    { name: 'Đại học Y Dược - ĐH Huế', shortName: 'HUMP', city: 'Thừa Thiên Huế', isPopular: true },
    { name: 'Đại học Kinh tế - ĐH Huế', shortName: 'HCE', city: 'Thừa Thiên Huế', isPopular: false },
    { name: 'Đại học Khoa học - ĐH Huế', shortName: 'HUSC', city: 'Thừa Thiên Huế', isPopular: false },
    { name: 'Đại học Sư phạm - ĐH Huế', shortName: 'HUE-EDU', city: 'Thừa Thiên Huế', isPopular: false },
    { name: 'Đại học Ngoại ngữ - ĐH Huế', shortName: 'HUCFL', city: 'Thừa Thiên Huế', isPopular: false },
    { name: 'Đại học Vinh', shortName: 'VINHUNI', city: 'Nghệ An', isPopular: true },
    { name: 'Đại học Quy Nhơn', shortName: 'QNU', city: 'Bình Định', isPopular: false },
    { name: 'Đại học Nha Trang', shortName: 'NTU', city: 'Khánh Hòa', isPopular: true },
    { name: 'Đại học Đà Lạt', shortName: 'DLU', city: 'Lâm Đồng', isPopular: true },
    { name: 'Đại học Tây Nguyên', shortName: 'TTN', city: 'Đắk Lắk', isPopular: false },

    // --- Hải Phòng & Thái Nguyên ---
    { name: 'Đại học Hàng Hải Việt Nam', shortName: 'VMU', city: 'Hải Phòng', isPopular: true },
    { name: 'Đại học Y Dược Hải Phòng', shortName: 'HPMU', city: 'Hải Phòng', isPopular: false },
    { name: 'Đại học Hải Phòng', shortName: 'THP', city: 'Hải Phòng', isPopular: false },
    { name: 'ĐH Kỹ thuật Công nghiệp - ĐH Thái Nguyên', shortName: 'TNUT', city: 'Thái Nguyên', isPopular: false },
    { name: 'ĐH Y Dược - ĐH Thái Nguyên', shortName: 'TUMP', city: 'Thái Nguyên', isPopular: false },
    { name: 'ĐH CNTT & Truyền thông - ĐH Thái Nguyên', shortName: 'ICTU', city: 'Thái Nguyên', isPopular: true },
    { name: 'ĐH Kinh tế & QTKD - ĐH Thái Nguyên', shortName: 'TUEBA', city: 'Thái Nguyên', isPopular: false },

    // --- Cần Thơ & Miền Tây ---
    { name: 'Đại học Cần Thơ', shortName: 'CTU', city: 'Cần Thơ', isPopular: true },
    { name: 'Đại học Y Dược Cần Thơ', shortName: 'CTUMP', city: 'Cần Thơ', isPopular: true },
    { name: 'Đại học Nam Cần Thơ', shortName: 'DNC', city: 'Cần Thơ', isPopular: false },
    { name: 'Đại học FPT Cần Thơ', shortName: 'FPT-CT', city: 'Cần Thơ', isPopular: false },
    { name: 'Đại học Kỹ thuật - Công nghệ Cần Thơ', shortName: 'CTUT', city: 'Cần Thơ', isPopular: false },
    { name: 'Đại học An Giang - ĐHQG TP.HCM', shortName: 'AGU', city: 'An Giang', isPopular: false },
    { name: 'Đại học Đồng Tháp', shortName: 'DThU', city: 'Đồng Tháp', isPopular: false },
    { name: 'Đại học Trà Vinh', shortName: 'TVU', city: 'Trà Vinh', isPopular: false },

    // --- Bình Dương & Đồng Nai ---
    { name: 'Đại học Quốc tế Miền Đông', shortName: 'EIU', city: 'Bình Dương', isPopular: false },
    { name: 'Đại học Thủ Dầu Một', shortName: 'TDMU', city: 'Bình Dương', isPopular: true },
    { name: 'Đại học Bình Dương', shortName: 'BDU', city: 'Bình Dương', isPopular: false },
    { name: 'Đại học Việt Đức', shortName: 'VGU', city: 'Bình Dương', isPopular: false },
    { name: 'Đại học Lạc Hồng', shortName: 'LHU', city: 'Đồng Nai', isPopular: false },
    { name: 'Đại học Đồng Nai', shortName: 'DNU', city: 'Đồng Nai', isPopular: false },
    { name: 'Đại học Bà Rịa - Vũng Tàu', shortName: 'BVU', city: 'Bà Rịa - Vũng Tàu', isPopular: false },

    // --- Tùy chọn khác ---
    { name: 'Trường Đại học / Cao đẳng / Khu vực khác', shortName: 'KHAC', city: 'Toàn quốc', isPopular: false }
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