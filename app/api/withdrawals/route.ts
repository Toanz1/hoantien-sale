import { NextResponse } from "next/server";

/**
 * Endpoint rút tiền cũ đã bị vô hiệu hóa.
 *
 * Yêu cầu rút tiền hiện phải được thực hiện thông qua
 * RPC public.request_withdrawal(..., p_pin)
 * để đảm bảo:
 * - xác thực người dùng
 * - kiểm tra PIN rút tiền
 * - kiểm tra số dư
 * - chống tạo yêu cầu vượt số dư
 * - xử lý logic rút tiền tại database
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "API rút tiền này đã ngừng sử dụng. Vui lòng thực hiện rút tiền từ Ví.",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}