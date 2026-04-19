import './globals.css';
import Script from 'next/script';

export async function generateMetadata() {
  const title = process.env.APP_TITLE || 'Election Graphic';
  return {
    title,
    description: 'CasparCG HTML Producer template for election party seats',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script id="casparcg-bootstrap" strategy="beforeInteractive">
          {`
            (function () {
              window.__casparCGQueue = window.__casparCGQueue || [];

              function enqueue(name, args) {
                window.__casparCGQueue.push({ name: name, args: Array.prototype.slice.call(args) });
              }

              window.play = function () { enqueue('play', arguments); };
              window.stop = function () { enqueue('stop', arguments); };
              window.next = function () { enqueue('next', arguments); };
              window.update = function () { enqueue('update', arguments); };
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
