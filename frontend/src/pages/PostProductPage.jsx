import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  GraduationCap, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import api from '../api';

export default function PostProductPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [city, setCity] = useState(user?.city || 'Hà Nội');
  const [universityId, setUniversityId] = useState(user?.universityId || '');
  const [uniSearch, setUniSearch] = useState('');
  const [district, setDistrict] = useState(user?.district || 'Cầu Giấy');
  const [meetingSpotType, setMeetingSpotType] = useState('CAMPUS');
  const [meetingSpotNote, setMeetingSpotNote] = useState('');
  const [description, setDescription] = useState('');
  const [zalo, setZalo] = useState(user?.zalo || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/post');
      return;
    }
    api.get('/categories').then(res => setCategories(res.data.categories || [])).catch(console.error);
    api.get('/universities').then(res => {
      setUniversities(res.data.universities || []);
      if (!universityId && res.data.universities?.length > 0) {
        setUniversityId(user?.universityId || res.data.universities[0].id);
      }
    }).catch(console.error);
  }, [isAuthenticated]);

  // Handle local image upload via backend /api/upload/multiple or single
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 8) {
      alert('Tối đa 8 hình ảnh cho mỗi sản phẩm!');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImages(prev => [...prev, ...res.data.urls]);
    } catch (err) {
      console.error(err);
      // Fallback: If local disk upload fails, add direct image placeholder
      alert('Tải ảnh thất bại hoặc định dạng không hỗ trợ. Vui lòng thử lại!');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddSampleImage = () => {
    const samples = [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setImages(prev => [...prev, pick]);
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim() || !categoryId || !description.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tiêu đề, danh mục và mô tả sản phẩm.');
      return;
    }

    if (!isFree && (!price || parseFloat(price) < 0)) {
      setErrorMsg('Vui lòng nhập giá bán hợp lệ hoặc chọn Tặng miễn phí 0đ.');
      return;
    }

    if (images.length === 0) {
      // Auto assign fallback image
      images.push('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
    }

    setSubmitting(true);
    try {
      const res = await api.post('/products', {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : parseFloat(price),
        isNegotiable: isFree ? false : isNegotiable,
        isFree,
        condition,
        categoryId,
        universityId: universityId || null,
        city: city.trim(),
        district: district.trim(),
        meetingSpotType,
        meetingSpotNote: meetingSpotNote.trim(),
        zalo: zalo.trim(),
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        images
      });

      alert('Đăng bán sản phẩm thành công!');
      navigate(`/product/${res.data.product.id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Đã có lỗi xảy ra khi đăng bán.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Đăng bán sản phẩm / Cho tặng đồ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Điền thông tin và hình ảnh để tiếp cận hàng nghìn bạn sinh viên trong khuôn viên trường
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Image Upload */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <span>Hình ảnh sản phẩm (1 - 8 ảnh) *</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ảnh đầu tiên sẽ làm ảnh bìa đại diện. Chụp rõ các góc, tem mác hoặc vết xước nếu có.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group">
                <img src={getImageUrl(img)} onError={handleImageError} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Ảnh bìa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {images.length < 8 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5 text-center p-2">
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                <span className="text-xs font-bold text-slate-600">Tải ảnh lên</span>
                <span className="text-[10px] text-slate-400">JPG, PNG (max 10MB)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {images.length === 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAddSampleImage}
                className="text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hoặc thêm ảnh mẫu nhanh để test đăng tin</span>
              </button>
            </div>
          )}
        </div>

        {/* Section 2: General Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-5">
          <h2 className="font-bold text-base text-slate-800">Thông tin cơ bản</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tên sản phẩm *</label>
            <input
              type="text"
              placeholder="VD: Giáo trình Giải tích 1 ĐH Bách Khoa, Laptop Thinkpad T480s..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Danh mục *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tình trạng thực tế *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NEW">Mới 100% (Chưa qua sử dụng)</option>
                <option value="LIKE_NEW">Như mới 99% (Dùng rất ít)</option>
                <option value="GOOD">Dùng tốt (Không lỗi lầm)</option>
                <option value="USED">Đã sử dụng (Có trầy xước nhẹ)</option>
                <option value="OLD">Cũ / Pass nhanh</option>
              </select>
            </div>
          </div>

          {/* Pricing & Free toggle (Spec Section 9 & 39) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Giá bán</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-black text-emerald-700">🎁 Tặng miễn phí (0đ) cho sinh viên</span>
              </label>
            </div>

            {!isFree ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="VD: 50000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required={!isFree}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-12 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Cho phép người mua thương lượng / bớt giá chút đỉnh
                  </span>
                </label>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 font-medium">
                Sản phẩm của bạn sẽ xuất hiện tại tab <strong>Góc Cho Tặng 0đ</strong> để giúp đỡ các bạn sinh viên có hoàn cảnh khó khăn hoặc tân sinh viên!
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Mô tả chi tiết *</label>
            <textarea
              rows={5}
              placeholder="Mô tả kỹ tình trạng thực tế: Đã dùng bao lâu, có lỗi gì không, phụ kiện đi kèm gồm những gì, lý do pass đồ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

        </div>

                {/* Section 2.5: Contact Links (Zalo, Facebook, Instagram) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4">
          <div>
            <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <span className="text-emerald-600 font-extrabold text-lg">🔗</span>
              <span>Thông tin liên hệ trực tiếp (Zalo, Facebook, Instagram)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Người mua có thể bấm vào để mở trực tiếp Zalo, Facebook hoặc Instagram của bạn để chốt đơn nhanh chóng!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Số điện thoại hoặc Link Zalo</span>
              </label>
              <input
                type="text"
                placeholder="VD: 0912345678 hoặc https://zalo.me/..."
                value={zalo}
                onChange={(e) => setZalo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Link Facebook cá nhân</span>
              </label>
              <input
                type="text"
                placeholder="https://facebook.com/..."
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500"></span>
                <span>Link Instagram cá nhân</span>
              </label>
              <input
                type="text"
                placeholder="https://instagram.com/..."
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        {/* Section 3: Safe Campus Trading Location (Spec Section 8) */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-5">
          <div>
            <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Địa điểm &amp; Trường học giao dịch</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn Tỉnh/Thành phố, trường ĐH hoặc nhập địa chỉ/khu vực tùy ý để người mua sinh viên dễ tìm thấy.
            </p>
          </div>

          {/* City & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tỉnh / Thành phố *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP.HCM">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Thái Nguyên">Thái Nguyên</option>
                <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                <option value="Khánh Hòa">Khánh Hòa (Nha Trang)</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Đồng Nai">Đồng Nai</option>
                <option value="Toàn quốc">Tỉnh / Thành phố khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Khu vực / Quận / Huyện *</label>
              <input
                type="text"
                placeholder="VD: Cầu Giấy, Đống Đa, Bách Khoa, KTX Khu B, Thủ Đức..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* University Picker with Search Filter */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800">
                🏫 Trường Đại Học / Học Viện (Toàn quốc)
              </label>
              <input
                type="text"
                placeholder="🔍 Tìm nhanh tên trường (Bách Khoa, NEU, Y, Ngoại Thương...)"
                value={uniSearch}
                onChange={(e) => setUniSearch(e.target.value)}
                className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Chọn trường hoặc để trống nếu giao dịch tại khu vực tự do --</option>
              {universities
                .filter(u => 
                  !uniSearch.trim() || 
                  u.name.toLowerCase().includes(uniSearch.toLowerCase()) || 
                  u.shortName.toLowerCase().includes(uniSearch.toLowerCase()) ||
                  u.city.toLowerCase().includes(uniSearch.toLowerCase())
                )
                .map(u => (
                  <option key={u.id} value={u.id}>
                    [{u.city}] {u.shortName} - {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Meeting spot type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Khu vực giao dịch đề xuất</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'CAMPUS', label: 'Cổng trường' },
                { id: 'DORM', label: 'Ký túc xá' },
                { id: 'RENTAL_AREA', label: 'Khu vực trọ' },
                { id: 'CENTER', label: 'Trung tâm' },
                { id: 'FLEXIBLE', label: 'Thỏa thuận' },
              ].map(spot => (
                <button
                  type="button"
                  key={spot.id}
                  onClick={() => setMeetingSpotType(spot.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    meetingSpotType === spot.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {spot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Meeting Note & Landmark Suggestions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Gợi ý địa chỉ / Điểm hẹn cụ thể (Công cộng)
            </label>
            <input
              type="text"
              placeholder="VD: Cổng Parabol Bách Khoa, KTX B10, sảnh nhà A1 NEU, cổng 144 Xuân Thủy, ngõ 175 Cầu Giấy..."
              value={meetingSpotNote}
              onChange={(e) => setMeetingSpotNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Gợi ý nhanh:</span>
              {[
                'Cổng Parabol ĐH Bách Khoa',
                'Sảnh nhà A1 NEU',
                'Cổng 144 Xuân Thủy (ĐHQG)',
                'KTX Mễ Trì',
                'KTX B10 Bách Khoa',
                'Cổng ĐH Thương Mại',
                'Cổng KTX Khu A ĐHQG',
                'Cổng KTX Khu B ĐHQG',
                'Cổng ĐH Sư Phạm Kỹ Thuật',
                'Cổng ĐH Bách Khoa ĐN'
              ].map((lm, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setMeetingSpotNote(lm)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors"
                >
                  + {lm}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-black shadow-lg shadow-emerald-600/30 transition-all"
          >
            {submitting ? 'Đang đăng tải...' : 'Hoàn tất & Đăng bán'}
          </button>
        </div>

      </form>

    </div>
  );
}