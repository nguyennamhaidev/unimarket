const prisma = require('../prisma');

exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryId,
      categorySlug,
      universityId,
      city,
      district,
      condition,
      isFree,
      isNegotiable,
      minPrice,
      maxPrice,
      status = 'ACTIVE',
      sortBy = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    // Only active products by default for public
    if (status) {
      where.status = status;
    }

    // Search
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { district: { contains: q } },
        { city: { contains: q } },
        { meetingSpotNote: { contains: q } },
        { university: { name: { contains: q } } },
        { university: { shortName: { contains: q } } }
      ];
    }

    // City Filter
    if (city && city !== 'all' && city.trim() !== '') {
      where.city = { contains: city.trim() };
    }

    // Category
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { subCategories: true }
      });
      if (cat) {
        if (cat.subCategories.length > 0) {
          where.categoryId = {
            in: [cat.id, ...cat.subCategories.map(c => c.id)]
          };
        } else {
          where.categoryId = cat.id;
        }
      }
    }

    // University
    if (universityId) {
      where.universityId = universityId;
    }

    // District
    if (district) {
      where.district = { contains: district };
    }

    // Condition
    if (condition) {
      where.condition = condition;
    }

    // Free items (0đ)
    if (isFree === 'true' || isFree === true) {
      where.OR = [
        { isFree: true },
        { price: 0 }
      ];
    } else {
      if (minPrice !== undefined && minPrice !== '') {
        where.price = { ...(where.price || {}), gte: parseFloat(minPrice) };
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        where.price = { ...(where.price || {}), lte: parseFloat(maxPrice) };
      }
    }

    // Negotiable
    if (isNegotiable === 'true') {
      where.isNegotiable = true;
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'views') orderBy = { views: 'desc' };
    else if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };

    const take = parseInt(limit) || 20;
    const skip = ((parseInt(page) || 1) - 1) * take;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
          },
          category: true,
          university: true,
          seller: {
            select: {
              id: true,
              fullName: true,
              username: true,
              avatar: true,
              rating: true,
              totalReviews: true,
              totalSold: true,
              university: { select: { id: true, name: true, shortName: true } }
            }
          },
          _count: {
            select: { favorites: true }
          }
        }
      })
    ]);

    // Check favorites if user is authenticated
    let favoritedProductIds = new Set();
    if (req.user) {
      const myFavs = await prisma.favorite.findMany({
        where: {
          userId: req.user.id,
          productId: { in: products.map(p => p.id) }
        },
        select: { productId: true }
      });
      favoritedProductIds = new Set(myFavs.map(f => f.productId));
    }

    const formattedProducts = products.map(p => ({
      ...p,
      isFavorited: favoritedProductIds.has(p.id),
      favoritesCount: p._count.favorites
    }));

    res.json({
      products: formattedProducts,
      pagination: {
        total,
        page: parseInt(page) || 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách sản phẩm.' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
        },
        category: true,
        university: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatar: true,
            bio: true,
            faculty: true,
            studentCohort: true,
            city: true,
            district: true,
            rating: true,
            totalReviews: true,
            totalSold: true,
            createdAt: true,
            university: true,
            zalo: true,
            facebook: true,
            instagram: true
          }
        },
        _count: {
          select: { favorites: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm này.' });
    }

    // Increment views async
    prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(console.error);

    let isFavorited = false;
    let isFollowing = false;
    if (req.user) {
      const [fav, follow] = await Promise.all([
        prisma.favorite.findUnique({
          where: { userId_productId: { userId: req.user.id, productId: id } }
        }),
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.id, followingId: product.sellerId } }
        })
      ]);
      isFavorited = !!fav;
      isFollowing = !!follow;
    }

    // Related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: id },
        status: 'ACTIVE',
        OR: [
          { categoryId: product.categoryId },
          { universityId: product.universityId }
        ]
      },
      take: 4,
      include: {
        images: { take: 1 },
        university: true,
        seller: {
          select: { fullName: true, avatar: true }
        }
      }
    });

    res.json({
      product: {
        ...product,
        views: product.views + 1,
        isFavorited,
        isFollowing,
        favoritesCount: product._count.favorites
      },
      relatedProducts
    });
  } catch (err) {
    console.error('getProductById error:', err);
    res.status(500).json({ message: 'Lỗi khi tải chi tiết sản phẩm.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price = 0,
      isNegotiable = true,
      isFree = false,
      condition = 'GOOD',
      categoryId,
      universityId,
      city,
      district,
      meetingSpotType = 'CAMPUS',
      meetingSpotNote = '',
      images = [],
      zalo,
      facebook,
      instagram
    } = req.body;

    if (!title || !description || !categoryId || !district) {
      return res.status(400).json({ message: 'Vui lòng điền tiêu đề, mô tả, danh mục và khu vực giao dịch.' });
    }

    const finalPrice = isFree ? 0 : Math.max(0, parseFloat(price) || 0);

    // Create product
    const product = await prisma.product.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: finalPrice,
        isNegotiable: isFree ? false : Boolean(isNegotiable),
        isFree: Boolean(isFree),
        condition,
        categoryId,
        universityId: universityId || req.user.universityId || null,
        city: city ? city.trim() : (req.user.city || 'Hà Nội'),
        district: district.trim(),
        meetingSpotType,
        meetingSpotNote: meetingSpotNote ? meetingSpotNote.trim() : null,
        zalo: zalo ? zalo.trim() : (req.user.zalo || null),
        facebook: facebook ? facebook.trim() : (req.user.facebook || null),
        instagram: instagram ? instagram.trim() : (req.user.instagram || null),
        sellerId: req.user.id,
        status: 'ACTIVE',
        images: {
          create: images.map((img, idx) => ({
            url: typeof img === 'string' ? img : img.url,
            isPrimary: idx === 0,
            order: idx
          }))
        }
      },
      include: {
        images: true,
        category: true,
        university: true,
        seller: {
          select: { id: true, fullName: true, username: true, avatar: true }
        }
      }
    });

    // Notify followers
    try {
      const followers = await prisma.follow.findMany({
        where: { followingId: req.user.id }
      });
      if (followers.length > 0) {
        await prisma.notification.createMany({
          data: followers.map(f => ({
            userId: f.followerId,
            title: 'Sản phẩm mới từ người bạn theo dõi',
            content: `${req.user.fullName} vừa đăng bán "${product.title}"`,
            type: 'NEW_POST',
            link: `/product/${product.id}`
          }))
        });
      }
    } catch (e) {
      console.error('Error notifying followers:', e);
    }

    res.status(201).json({
      message: 'Đăng bán sản phẩm thành công!',
      product
    });
  } catch (err) {
    console.error('createProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi đăng bán sản phẩm.' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      isNegotiable,
      isFree,
      condition,
      categoryId,
      universityId,
      district,
      meetingSpotType,
      meetingSpotNote,
      images
    } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (existing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa sản phẩm này.' });
    }

    // Rule: Cannot edit if already SOLD
    if (existing.status === 'SOLD' && req.user.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Không thể chỉnh sửa sản phẩm đã đánh dấu đã bán.' });
    }

    // Update fields
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description.trim() : existing.description,
        price: isFree ? 0 : (price !== undefined ? parseFloat(price) : existing.price),
        isNegotiable: isFree ? false : (isNegotiable !== undefined ? Boolean(isNegotiable) : existing.isNegotiable),
        isFree: isFree !== undefined ? Boolean(isFree) : existing.isFree,
        condition: condition || existing.condition,
        categoryId: categoryId || existing.categoryId,
        universityId: universityId || existing.universityId,
        district: district || existing.district,
        meetingSpotType: meetingSpotType || existing.meetingSpotType,
        meetingSpotNote: meetingSpotNote !== undefined ? meetingSpotNote : existing.meetingSpotNote,
        zalo: zalo !== undefined ? zalo : existing.zalo,
        facebook: facebook !== undefined ? facebook : existing.facebook,
        instagram: instagram !== undefined ? instagram : existing.instagram,
      }
    });

    // Update images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: images.map((img, idx) => ({
          productId: id,
          url: typeof img === 'string' ? img : img.url,
          isPrimary: idx === 0,
          order: idx
        }))
      });
    }

    res.json({
      message: 'Cập nhật sản phẩm thành công!',
      product: updated
    });
  } catch (err) {
    console.error('updateProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm.' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (existing.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này.' });
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Đã xóa sản phẩm thành công.' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm.' });
  }
};

exports.markAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerId } = req.body;

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Chỉ người bán mới có quyền đánh dấu đã bán.' });
    }

    // Update status to SOLD
    const updated = await prisma.product.update({
      where: { id },
      data: { status: 'SOLD' }
    });

    // Increment seller's totalSold
    await prisma.user.update({
      where: { id: product.sellerId },
      data: { totalSold: { increment: 1 } }
    });

    // If buyerId provided or find buyer from conversations
    let targetBuyerId = buyerId;
    if (!targetBuyerId) {
      const lastConv = await prisma.conversation.findFirst({
        where: { productId: id },
        orderBy: { lastMessageAt: 'desc' }
      });
      if (lastConv) {
        targetBuyerId = lastConv.buyerId;
      }
    }

    let transaction = null;
    if (targetBuyerId && targetBuyerId !== product.sellerId) {
      transaction = await prisma.transaction.create({
        data: {
          productId: id,
          sellerId: product.sellerId,
          buyerId: targetBuyerId,
          status: 'COMPLETED'
        }
      });

      // Send notification to buyer to review
      await prisma.notification.create({
        data: {
          userId: targetBuyerId,
          title: 'Giao dịch hoàn tất! Đánh giá người bán ⭐',
          content: `Bạn đã mua thành công "${product.title}". Hãy gửi đánh giá trải nghiệm cho người bán nhé!`,
          type: 'SOLD',
          link: `/messages?product=${id}&review=true`
        }
      });
    }

    res.json({
      message: 'Đã đánh dấu sản phẩm ĐÃ BÁN thành công!',
      product: updated,
      transaction
    });
  } catch (err) {
    console.error('markAsSold error:', err);
    res.status(500).json({ message: 'Lỗi khi đánh dấu đã bán.' });
  }
};

exports.toggleHide = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bạn không có quyền ẩn sản phẩm này.' });
    }

    const nextStatus = product.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
    const updated = await prisma.product.update({
      where: { id },
      data: { status: nextStatus }
    });

    res.json({
      message: nextStatus === 'HIDDEN' ? 'Đã ẩn sản phẩm.' : 'Đã hiện lại sản phẩm.',
      product: updated
    });
  } catch (err) {
    console.error('toggleHide error:', err);
    res.status(500).json({ message: 'Lỗi khi ẩn/hiện sản phẩm.' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const { status = 'ACTIVE' } = req.query;

    const products = await prisma.product.findMany({
      where: {
        sellerId: req.user.id,
        status: status === 'ALL' ? undefined : status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1 },
        category: true,
        university: true,
        _count: {
          select: {
            favorites: true,
            conversations: true
          }
        }
      }
    });

    res.json({ products });
  } catch (err) {
    console.error('getMyProducts error:', err);
    res.status(500).json({ message: 'Lỗi khi tải sản phẩm của bạn.' });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params; // product id

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: id
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return res.json({ favorited: false, message: 'Đã bỏ yêu thích sản phẩm.' });
    } else {
      await prisma.favorite.create({
        data: {
          userId: req.user.id,
          productId: id
        }
      });
      return res.json({ favorited: true, message: 'Đã thêm vào danh sách yêu thích!' });
    }
  } catch (err) {
    console.error('toggleFavorite error:', err);
    res.status(500).json({ message: 'Lỗi khi thao tác yêu thích.' });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: { take: 1 },
            seller: {
              select: { id: true, fullName: true, username: true, avatar: true }
            },
            category: true,
            university: true
          }
        }
      }
    });

    res.json({
      favorites: favorites.map(f => f.product)
    });
  } catch (err) {
    console.error('getMyFavorites error:', err);
    res.status(500).json({ message: 'Lỗi khi tải danh sách yêu thích.' });
  }
};