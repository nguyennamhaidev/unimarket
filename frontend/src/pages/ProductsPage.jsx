import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  GraduationCap, 
  Tag, 
  ChevronRight,
  PackageOpen
} from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import api from '../api';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters state initialized from URL search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [categorySlug, setCategorySlug] = useState(searchParams.get('categorySlug') || '');
  const [universityId, setUniversityId] = useState(searchParams.get('universityId') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [isFree, setIsFree] = useState(searchParams.get('isFree') === 'true');
  const [isNegotiable, setIsNegotiable] = useState(searchParams.get('isNegotiable') === 'true');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  useEffect(() => {
    // Load categories & universities
    api.get('/categories').then(res => setCategories(res.data.categories || [])).catch(console.error);
    api.get('/universities').then(res => setUniversities(res.data.universities || [])).catch(console.error);
  }, []);

  // Update states when URL changes
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategoryId(searchParams.get('categoryId') || '');
    setCategorySlug(searchParams.get('categorySlug') || '');
    setUniversityId(searchParams.get('universityId') || '');
    setDistrict(searchParams.get('district') || '');
    setCondition(searchParams.get('condition') || '');
    setIsFree(searchParams.get('isFree') === 'true');
    setIsNegotiable(searchParams.get('isNegotiable') === 'true');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: Object.fromEntries(searchParams.entries()) });
      setProducts(res.data.products || []);
      setPagination(res.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (newParams = {}) => {
    const params = new URLSearchParams(searchParams);
    
    // Merge newParams or current state
    const filters = {
      search,
      categoryId,
      categorySlug,
      universityId,
      district,
      condition,
      isFree: isFree ? 'true' : '',
      isNegotiable: isNegotiable ? 'true' : '',
      minPrice,
      maxPrice,
      sortBy,
      ...newParams
    };

    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });

    params.set('page', '1');
    setSearchParams(params);
    setMobileFilterOpen(false);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setCategorySlug('');
    setUniversityId('');
    setDistrict('');
    setCondition('');
    setIsFree(false);
    setIsNegotiable(false);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header & Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Khám phá đồ sinh viên pass
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tìm thấy <strong className="text-emerald-600 font-bold">{pagination.total}</strong> món đồ phù hợp
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Bộ lọc</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium shrink-0">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                applyFilters({ sortBy: e.target.value });
              }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">🆕 Mới nhất</option>
              <option value="price_asc">💵 Giá thấp → cao</option>
              <option value="price_desc">💎 Giá cao → thấp</option>
              <option value="views">🔥 Nhiều lượt xem</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
        
        {/* Sidebar Filters (Desktop) */}
        <aside className={`md:col-span-1 space-y-6 ${mobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Bộ lọc tìm kiếm</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          </div>

          {/* Search keyword */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Từ khóa</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tên đồ, mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* University Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trường Đại Học</span>
            </label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả các trường</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.shortName} - {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Danh mục</span>
            </label>
            <select
              value={categoryId || categorySlug}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryId(val);
                setCategorySlug('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* District / Khu vực */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Khu vực / Quận</label>
            <input
              type="text"
              placeholder="Cầu Giấy, Hai Bà Trưng..."
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Condition Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tình trạng đồ</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Tất cả tình trạng</option>
              <option value="NEW">Mới 100%</option>
              <option value="LIKE_NEW">Như mới 99%</option>
              <option value="GOOD">Dùng tốt</option>
              <option value="USED">Đã sử dụng</option>
              <option value="OLD">Cũ / Pass nhanh</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Khoảng giá (VNĐ)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Từ (đ)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Đến (đ)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-emerald-700">🎁 Chỉ đồ Cho Tặng 0đ</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700">Có thể thương lượng giá</span>
            </label>
          </div>

          {/* Apply Button */}
          <div className="pt-3">
            <button
              onClick={() => applyFilters()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              Áp dụng bộ lọc
            </button>
            {mobileFilterOpen && (
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full mt-2 bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl"
              >
                Đóng
              </button>
            )}
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-slate-100 p-4"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <PackageOpen className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">Không tìm thấy món đồ nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy thử xóa bớt bộ lọc hoặc gõ từ khóa tìm kiếm chung hơn (ví dụ: giáo trình, bàn học, tai nghe...).
              </p>
              <button
                onClick={resetFilters}
                className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
              >
                Đặt lại tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>

    </div>
  );
}