# 🎓 UniMarket - Sàn Thương Mại Điện Tử Đồ Cũ Dành Riêng Cho Sinh Viên (Student Market)

> Nền tảng C2C tối ưu hóa chuyên biệt cho cộng đồng sinh viên các trường Đại học: Pass giáo trình, đồ điện tử, đồ phòng trọ, phương tiện và góc cho tặng đồ 0đ. Giao dịch trực tiếp (Face-to-Face), **không ví điện tử / không cổng thanh toán / không KYC CCCD phức tạp**.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Phân quyền 3 Cấp độ
- **Guest (Khách vãng lai)**: Duyệt xem trang chủ, tìm kiếm, lọc theo trường ĐH / khu vực / giá / tình trạng, xem chi tiết sản phẩm và shop người bán.
- **Sinh viên (User)**: Đăng ký siêu đơn giản (Họ tên, Username, Email, Mật khẩu, Trường/Khoa/Khóa), Đăng bán sản phẩm (kèm ảnh, tình trạng, điểm hẹn cổng trường/KTX), Chat trực tiếp thời gian thực gắn liền sản phẩm, Đánh dấu đã bán, Đánh giá 1-5 sao sau giao dịch, Yêu thích, Báo cáo vi phạm, Quản lý tin bán & hồ sơ.
- **Ban Quản Trị (Admin)**: Dashboard thống kê toàn diện (Users, Products, Messages, Reports, Banned users), Quản lý người dùng (Khóa/Mở khóa), Quản lý sản phẩm (Ẩn/Xóa vi phạm), Xử lý báo cáo tố cáo (Giữ/Xóa/Cảnh cáo/Khóa user), Quản lý trường ĐH & danh mục, Nhật ký thao tác (Audit Logs).

### 2. Kết nối Mạng Xã Hội 1-Click mở Trang Cá Nhân (TCN)
- **Tại Chi tiết sản phẩm**: Nút **"💬 Nhắn tin / Liên hệ người bán"** mở Modal đa kênh gồm:
  - 💬 Nhắn tin trực tiếp trên UniMarket (Chat gắn liền sản phẩm).
  - 📱 Mở Zalo chat (`https://zalo.me/...`).
  - 🌐 Mở Facebook Trang Cá Nhân (`https://facebook.com/...`).
  - 📷 Mở Instagram Trang Cá Nhân (`https://instagram.com/...`).
- **Trong khung Chat trực tiếp**:
  - Thanh Header cuộc trò chuyện tích hợp sẵn nút bấm nhanh mở Zalo, Facebook, Instagram của đối phương.
  - Nút **"📲 Gửi Trang Cá Nhân (Zalo/FB/IG)"** giúp gửi ngay một Thẻ liên hệ tương tác (Social Card) vào khung chat; người nhận bấm vào sẽ chuyển thẳng đến trang cá nhân của người gửi.
  - Tin nhắn tự động nhận diện URL Facebook / Zalo / Instagram và hiển thị thành Card tương tác bấm được ngay.

### 3. Chat gắn liền Sản phẩm (Product-bound Chat)
- Header cuộc trò chuyện luôn ghim cố định sản phẩm đang thương lượng (ảnh, giá, tên, nút xem sản phẩm).
- Nút **"Đánh dấu đã bán cho bạn này"** ngay trong cuộc trò chuyện giúp chốt giao dịch tức thì và chuyển trạng thái sản phẩm sang `SOLD`.
- Popup đánh giá 1-5 sao và lời nhận xét ngay sau khi chốt giao dịch, tự động tính điểm uy tín cho sinh viên.

### 4. Bảo mật Quyền riêng tư & Mạng lưới theo Trường ĐH
- Tuyệt đối không công khai địa chỉ phòng trọ cá nhân. Chỉ hiển thị Quận/Huyện và điểm hẹn công cộng (Cổng trường, KTX, Sân bóng, Căn tin...).
- Lọc nhanh theo các trường ĐH lớn: Bách Khoa (HUST), Kinh tế Quốc dân (NEU), ĐHQGHN (VNU), Ngoại thương (FTU), Thương mại (TMU), PTIT, HCMUT, UIT...

### 5. Dữ liệu Thật 100% & Không Phụ Thuộc Cài Đặt Ngoài
- Database sử dụng **SQLite + Prisma Client** lưu trữ trực tiếp trong `backend/prisma/dev.db`.
- Tự động tạo và lưu trữ dữ liệu vĩnh viễn, không cần cài đặt phần mềm PostgreSQL bên ngoài.

---

## 🚀 Hướng Dẫn Chạy Demo & Cài Đặt

### Cách 1: Click đúp chạy ngay trên Windows (Khuyến nghị)
- Click đúp vào file `start.bat` trong thư mục `unimarket/` để tự động mở cả Backend (Port 5000) và Frontend (Port 5173).
- Mở trình duyệt truy cập: **`http://localhost:5173`**

### Cách 2: Khởi chạy thủ công qua Terminal

```bash
# 1. Cài đặt và chuẩn bị Database (Chỉ cần chạy 1 lần đầu)
npm run setup

# 2. Khởi chạy Backend (Port 5000) và Frontend (Port 5173)
npm run dev
```

Hoặc chạy từng phần:
```bash
# Terminal 1 - Backend:
cd backend
npm install
node prisma/seed.js
npm start

# Terminal 2 - Frontend:
cd frontend
npm install
npm run dev
```

---

## 🔑 Thông Tin Tài Khoản Quản Trị Viên (Admin)

| Vai trò | Tên đăng nhập / Email | Mật khẩu | Chức năng |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin Tối Cao** | `NguyenNamHai` <br> `nguyennamhaibusiness@gmail.com` | `Plan_Me22` | Quản trị toàn bộ nền tảng tại `/admin`: Xem thống kê, khóa user, xóa sản phẩm vi phạm, duyệt report, quản lý trường ĐH & danh mục, xem nhật ký admin logs. |

---

## 📤 Hướng Dẫn Đẩy Lên GitHub

Sau khi hoàn tất, bạn chỉ cần mở Terminal tại thư mục `unimarket` và chạy các lệnh sau để đẩy toàn bộ code và database lên GitHub của bạn:

```bash
# 1. Khởi tạo Git repository (nếu chưa có)
git init

# 2. Thêm tất cả file vào git
git add .

# 3. Tạo commit
git commit -m "feat: complete unimarket student secondhand marketplace platform"

# 4. Đổi nhánh chính sang main
git branch -M main

# 5. Liên kết tới kho lưu trữ GitHub của bạn
git remote add origin https://github.com/<tai-khoan-github-cua-ban>/<ten-repository>.git

# 6. Đẩy code lên GitHub
git push -u origin main
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
unimarket/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Định nghĩa toàn bộ schema CSDL (Users, Products, Chats, Reviews, Reports,...)
│   │   ├── seed.js            # Script khởi tạo danh mục, trường ĐH và tài khoản Admin chuẩn
│   │   └── dev.db             # File cơ sở dữ liệu SQLite lưu trữ thật
│   ├── src/
│   │   ├── controllers/       # Xử lý logic API (auth, products, chat, reviews, reports, admin, users)
│   │   ├── middlewares/       # Middleware xác thực JWT và phân quyền Admin
│   │   ├── routes/            # Khai báo các endpoint REST API
│   │   └── server.js          # Khởi tạo Express Server & Socket.IO Realtime
│   ├── uploads/               # Thư mục lưu trữ hình ảnh sản phẩm tải lên
│   ├── .env                   # Biến môi trường Backend
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/               # Cấu hình Axios gọi API
│   │   ├── components/        # Layout (Navbar, Footer), ProductCard, Modals
│   │   ├── context/           # AuthContext, SocketContext
│   │   ├── pages/             # HomePage, ProductsPage, ProductDetailPage, PostProductPage, ChatPage, UserProfilePage, AdminDashboardPage,...
│   │   ├── App.jsx            # Định tuyến React Router
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── start.bat                  # File Click đúp khởi chạy tức thì trên Windows
├── start-all.ps1              # Script khởi chạy PowerShell
├── package.json               # Package root hỗ trợ npm run setup, npm run dev
└── README.md                  # Hướng dẫn toàn diện dự án
```
