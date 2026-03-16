import React from 'react';
import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Инструменты для автоматизации счетов',
  description: 'Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
