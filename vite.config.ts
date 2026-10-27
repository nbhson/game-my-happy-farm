import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // dev (5173) proxy API + realtime về LAN server (8931): chạy `npm run dev`
    // kèm `npm run server` thì save xe/đồ mới vào được DB, không rớt local
    proxy: {
      '/api': 'http://localhost:8931',
      '/socket.io': { target: 'http://localhost:8931', ws: true },
    },
  },
  build: {
    // Toàn bộ code game (render canvas / store / net) là một đồ thị module liên kết
    // chặt và cần ngay lúc boot → không tách async; vendor đã chia riêng bên dưới
    // để cache lâu dài. Giới hạn warning nâng lên 900kB cho chunk game chính.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Chia vendor thành các chunk riêng: cache lâu dài khi update code game,
        // và tránh warning "chunk > 500kB" do gom tất cả vào 1 file
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // react/react-dom đứng trước lucide-react (tên có chứa 'react')
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/[\\/]node_modules[\\/](lucide-react|framer-motion|motion)/.test(id)) return 'vendor-ui';
          if (/[\\/]node_modules[\\/](socket\.io-client|engine\.io-client|@supabase)[\\/]/.test(id)) return 'vendor-net';
          return 'vendor-misc';
        },
      },
    },
  },
});
