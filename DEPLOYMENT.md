# Hướng dẫn Deploy dự án Henei Dimsum 🚀

Dự án này là ứng dụng MERN stack, bạn có thể deploy lên các dịch vụ miễn phí hoặc trả phí như Vercel (Frontend) và Render/Vercel (Backend).

## 1. Cơ sở dữ liệu (MongoDB Atlas)
Bạn đã có dữ liệu trên MongoDB Atlas, điều này rất tốt. 
- Hãy đảm bảo biến `MONGO_URI` trong file `.env` trỏ đúng vào database `test` như chúng ta đã làm.
- Cấu hình **Network Access** trên MongoDB Atlas: Thêm IP `0.0.0.0/0` để cho phép các server deploy truy cập được.

## 2. Deploy Backend (Lên Render.com hoặc Vercel)

### Cách A: Deploy lên Render (Dễ nhất cho Node.js)
1. Tạo tài khoản [Render](https://render.com/).
2. Chọn **New > Web Service**.
3. Kết nối với repository GitHub của bạn.
4. Cấu hình:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js` (hoặc `npm start`)
5. Thêm **Environment Variables**:
   - `MONGO_URI`: (Đường dẫn Atlas của bạn)
   - `JWT_SECRET`: (Chuỗi bí mật của bạn)
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: (URL của Frontend sau khi deploy - ví dụ: `https://henei-dimsum.vercel.app`)

### Cách B: Deploy lên Vercel
1. Cài đặt Vercel CLI: `npm i -g vercel`.
2. Chạy lệnh `vercel` trong thư mục `backend`.
3. Vercel sẽ tự động nhận diện file `vercel.json` đã có sẵn.

## 3. Deploy Frontend (Lên Vercel)
1. Truy cập [Vercel](https://vercel.com/dashboard).
2. Chọn **Add New > Project**.
3. Kết nối GitHub và chọn repo này.
4. Cấu hình:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Thêm **Environment Variables**:
   - `REACT_APP_API_URL`: (URL của Backend sau khi deploy - ví dụ: `https://henei-backend.onrender.com`)

## 4. Hướng dẫn Chạy Local (Để Demo/Phát triển)

Để chạy dự án ngay trên máy tính của bạn mà không phụ thuộc vào internet (hoặc để demo dự phòng), hãy làm theo các bước sau:

### Cấu hình file .env
Bạn hãy tạo hoặc sửa file `.env` ở cả hai thư mục:

**Backend (`/backend/.env`):**
```env
PORT=5000
MONGO_URI=mongodb+srv://... (Link database của bạn)
JWT_SECRET=HeneiDimsum2024
# FRONTEND_URL=http://localhost:3000
```
*(Nếu muốn chạy local, hãy để trống hoặc xóa `FRONTEND_URL` để nó tự nhận localhost).*

**Frontend (`/frontend/.env`):**
```env
# REACT_APP_API_URL=http://localhost:5000/api
```
*(Mặc định nếu bạn không điền gì, Frontend sẽ tự gọi vào localhost:5000).*

### Các bước khởi động
1. **Mở Terminal 1 (Backend):**
   ```powershell
   cd backend
   npm run dev
   ```
2. **Mở Terminal 2 (Frontend):**
   ```powershell
   cd frontend
   npm start
   ```

### 💡 Mẹo Chuyển đổi Nhanh
- **Demo Local dùng Data Render:** Điền `REACT_APP_API_URL=https://henei-dimsum.onrender.com/api` vào `/frontend/.env`.
- **Demo Offline hoàn toàn:** Xóa/Đóng các dòng URL trong cả 2 file `.env` ở máy.

## 5. Lưu ý quan trọng
- Sau khi có URL của cả 2 bên, hãy quay lại phần biến môi trường (Environment Variables) để cập nhật chính xác `FRONTEND_URL` cho Backend và `REACT_APP_API_URL` cho Frontend để tránh lỗi CORS.
- Luôn chạy lệnh **Redeploy** trên Vercel sau khi thay đổi Biến môi trường.
