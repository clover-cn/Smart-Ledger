import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path"; // 需安装 @types/node（如果报错）
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@static": path.resolve(__dirname, "./src/static"),
    },
  }
});
