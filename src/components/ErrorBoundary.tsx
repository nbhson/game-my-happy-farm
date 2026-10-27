// ===== ERROR BOUNDARY — lỗi render 1 vùng không giết cả app =====
// Chuẩn enterprise: bắt lỗi render Canvas/modal, hiện màn "Chơi tiếp được"
// + nút tải lại, thay vì trắng trang. Log ra console để debug.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Tên vùng để hiện trong thông báo lỗi (vd: "Bản đồ nông trại") */
  label?: string;
}

interface EBState {
  hasError: boolean;
  msg: string;
}

export default class ErrorBoundary extends Component<Props, EBState> {
  state: EBState = { hasError: false, msg: '' };

  static getDerivedStateFromError(err: unknown): EBState {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const stack = info.componentStack?.split('\n').slice(0, 4).join(' | ');
    console.error('[ErrorBoundary]', this.props.label ?? 'region', `${error.message}\n${stack ?? ''}`);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        className="m-auto max-w-md rounded-xl border-2 border-red-300 bg-red-50 p-6 text-center shadow-lg"
      >
        <div className="mb-2 text-4xl">🌾</div>
        <h2 className="mb-1 text-lg font-black text-red-700">
          {this.props.label ?? 'Phần trò chơi'} gặp lỗi tạm thời
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Không mất tiến trình — tiến trình của bạn đã lưu tự động.
        </p>
        <button
          className="pixel-btn"
          onClick={() => this.setState({ hasError: false, msg: '' })}
        >
          ↻ Thử lại
        </button>
      </div>
    );
  }
}
