import { BackendUnavailableError } from '@/services/supabase/client';

/** Maps Supabase Auth error codes to friendly Vietnamese messages. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
  email_not_confirmed: 'Bạn cần xác nhận email trước khi đăng nhập. Hãy kiểm tra hộp thư (cả mục Spam).',
  user_already_exists: 'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
  email_exists: 'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
  weak_password: 'Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự, kết hợp chữ và số.',
  same_password: 'Mật khẩu mới phải khác mật khẩu cũ.',
  email_address_invalid: 'Địa chỉ email không hợp lệ.',
  signup_disabled: 'Hiện chưa mở đăng ký tài khoản mới.',
  over_email_send_rate_limit: 'Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau ít phút.',
  over_request_rate_limit: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
  session_not_found: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  refresh_token_not_found: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  flow_state_expired: 'Liên kết đã hết hạn. Vui lòng yêu cầu liên kết mới.',
  flow_state_not_found: 'Liên kết không hợp lệ hoặc đã được dùng. Hãy mở liên kết trên cùng trình duyệt bạn đã yêu cầu.',
  otp_expired: 'Liên kết đã hết hạn. Vui lòng yêu cầu liên kết mới.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof BackendUnavailableError) return 'Tính năng tài khoản chưa được cấu hình trên máy chủ này.';
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'Bạn đang ngoại tuyến. Hãy kết nối mạng và thử lại.';
  if (error && typeof error === 'object') {
    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
    if (code && MESSAGES[code]) return MESSAGES[code];
    const status = 'status' in error && typeof error.status === 'number' ? error.status : undefined;
    if (status === 429) return MESSAGES.over_request_rate_limit!;
    if (status === 0 || (error instanceof Error && /fetch|network/i.test(error.message))) {
      return 'Không kết nối được máy chủ. Hãy kiểm tra mạng và thử lại.';
    }
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}
