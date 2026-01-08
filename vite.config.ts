import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 1. base 선언은 return 객체 내부에서만 하면 됩니다. (바깥쪽 base: ... 삭제)
    const env = loadEnv(mode, '.', '');
    
    return {
      // 2. GitHub Pages 배포를 위한 핵심 설정입니다.
      base: '/Project0002/', 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
          //빌드 결과물 저장 폴더 
        outDir: 'dist',
      }
    };
});
