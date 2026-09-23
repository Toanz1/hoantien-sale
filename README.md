# Hoan Tien Sale

MVP cho website:
- Dán link Shopee / Lazada / TikTok Shop
- Nhận diện nền tảng
- Sinh tracking ID riêng
- Lưu lịch sử link vào Supabase
- Chuẩn bị database đơn hàng/cashback/ví/rút tiền
- Sau này import Excel báo cáo affiliate

## 1. Cài đặt

```bash
npm install
copy .env.example .env.local
npm run dev
```

Mở http://localhost:3000

## 2. Supabase

Tạo project Supabase miễn phí.

Vào SQL Editor, chạy toàn bộ file:

supabase/schema.sql

Sau đó điền:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

## 3. Affiliate adapters

`lib/affiliate.ts` cố ý KHÔNG đoán cú pháp affiliate của Shopee/Lazada/TikTok.

Sau khi xác nhận chính xác cơ chế deep-link/custom-link của từng tài khoản, cấu hình:

SHOPEE_AFFILIATE_TEMPLATE=
LAZADA_AFFILIATE_TEMPLATE=
TIKTOK_AFFILIATE_TEMPLATE=

Template phải được cung cấp bởi cơ chế affiliate tương ứng và hỗ trợ `{url}` / `{subid}` theo adapter bạn triển khai.

Không copy một link affiliate mẫu rồi dùng nguyên link đó cho mọi sản phẩm.

## 4. Roadmap

1. Auth + profile
2. Affiliate adapters chính xác cho 3 network
3. Trang lịch sử link
4. Admin import Excel
5. Mapping tracking_id -> user
6. Tính cashback
7. Wallet
8. Withdrawal
9. Referral
10. Deploy Vercel
