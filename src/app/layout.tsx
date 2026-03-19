import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paucartambo Segura - Comisaría de Paucartambo',
  description: 'Sistema de gestión y registro de denuncias para la Comisaría de Paucartambo, Cusco.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}