import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, HeartHandshake, MapPin, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 pt-12 pb-8 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Value Props Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Giao dịch Trực tiếp (Face-to-Face)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Xem tận mắt, kiểm tra tận tay tại cổng trường, KTX hoặc quán cafe. Không lo ship ảo hay thanh toán lừa đảo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Bảo mật Quyền riêng tư</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tuyệt đối không yêu cầu hay công khai địa chỉ nhà riêng và số điện thoại. Chat an toàn ngay trên nền tảng.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Mạng lưới Theo Trường Đại Học</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dễ dàng tìm thấy các bạn học cùng trường hoặc cùng khu KTX để pass giáo trình và trao đổi đồ siêu tốc.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-slate-800 tracking-tight">UniMarket</span>
            </div>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Nền tảng thanh lý đồ cũ, giáo trình, phòng trọ dành riêng cho sinh viên Việt Nam. Tiết kiệm, kết nối và sẻ chia.
            </p>
            <div className="mt-4 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Nghiêm cấm đăng bán hàng giả, vũ khí, chất kích thích và tài khoản hack.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Danh mục phổ biến</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products?categorySlug=sach-giao-trinh" className="hover:text-emerald-600 transition-colors">Sách & Giáo trình đại học</Link></li>
              <li><Link to="/products?categorySlug=dien-tu" className="hover:text-emerald-600 transition-colors">Laptop & Đồ điện tử</Link></li>
              <li><Link to="/products?categorySlug=do-phong-tro" className="hover:text-emerald-600 transition-colors">Đồ phòng trọ & Quạt điện</Link></li>
              <li><Link to="/products?categorySlug=phuong-tien" className="hover:text-emerald-600 transition-colors">Xe đạp & Xe máy sinh viên</Link></li>
              <li><Link to="/products?isFree=true" className="text-emerald-600 font-bold hover:underline">Góc Cho Tặng 0đ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Khu vực & Trường ĐH</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/products?district=Cầu Giấy" className="hover:text-emerald-600 transition-colors">Khu vực Cầu Giấy (VNU, TMU, Sư Phạm)</Link></li>
              <li><Link to="/products?district=Hai Bà Trưng" className="hover:text-emerald-600 transition-colors">Khu Bách - Kinh - Xây</Link></li>
              <li><Link to="/products?district=Đống Đa" className="hover:text-emerald-600 transition-colors">Khu Đống Đa - Chùa Láng (FTU, Ngoại Giao)</Link></li>
              <li><Link to="/products?district=Thanh Xuân" className="hover:text-emerald-600 transition-colors">Khu KTX Mễ Trì - KHTN & KHXHNV</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Hỗ trợ sinh viên</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Gặp khó khăn hay nghi vấn người bán lừa đảo? Sử dụng chức năng <strong>Báo cáo (Report)</strong> trực tiếp tại trang sản phẩm hoặc trang cá nhân.
            </p>
            <div className="text-xs font-medium text-slate-500">
              Email hỗ trợ: <span className="text-slate-800 font-semibold">support@unimarket.edu.vn</span>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © 2026 UniMarket. Sàn thương mại điện tử sinh viên - Kết nối khuôn viên, sẻ chia tri thức.
        </div>

      </div>
    </footer>
  );
}