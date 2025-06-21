import { ReactNode } from 'react';

export const metadata = {
  title: '用户微服务',
  description: '用户管理微服务 API',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}