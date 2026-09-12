const prisma = require('../prisma');

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        subCategories: true,
        _count: {
          select: { products: true }
        }
      }
    });

    res.json({ categories });
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh mục.' });
  }
};

exports.getUniversities = async (req, res) => {
  try {
    const universities = await prisma.university.findMany({
      orderBy: [{ isPopular: 'desc' }, { shortName: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { status: 'ACTIVE' } } }
        }
      }
    });

    res.json({ universities });
  } catch (err) {
    console.error('getUniversities error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách trường đại học.' });
  }
};

exports.getLocations = async (req, res) => {
  try {
    // Return standard student areas in Hanoi & HCMC
    const locations = [
      {
        city: 'Hà Nội',
        districts: [
          'Cầu Giấy',
          'Hai Bà Trưng',
          'Đống Đa',
          'Thanh Xuân',
          'Nam Từ Liêm',
          'Bắc Từ Liêm',
          'Hoàng Mai',
          'Ba Đình'
        ]
      },
      {
        city: 'TP.HCM',
        districts: [
          'TP. Thủ Đức',
          'Quận 1',
          'Quận 3',
          'Quận 5',
          'Quận 10',
          'Bình Thạnh',
          'Gò Vấp',
          'Tân Bình'
        ]
      }
    ];

    res.json({ locations });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tải khu vực.' });
  }
};