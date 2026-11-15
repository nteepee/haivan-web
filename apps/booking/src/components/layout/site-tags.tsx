import Script from "next/script";

/**
 * Tag theo dõi của haivan.com (lấy từ <head> web cũ ngày 2026-11-13): Google Tag Manager, Google Analytics 4, Facebook Pixel.
 * Cùng bộ mã với theme WordPress (inc/site-tags.php) để một khách đi từ trang WP sang trang Next vẫn là một phiên.
 * Mã đè được bằng NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_FB_PIXEL_ID (chuỗi rỗng = tắt tag đó);
 * HV_TRACKING=0 tắt toàn bộ (vd. bản thử không muốn ghi số liệu vào tài khoản thật). Đọc lúc build.
 */
const pick = (value: string | undefined, fallback: string) => (value === undefined ? fallback : value.trim());

export const SITE_TAGS = {
  enabled: process.env.HV_TRACKING !== "0",
  gtm: pick(process.env.NEXT_PUBLIC_GTM_ID, "GTM-NW5R7PS6"),
  ga: pick(process.env.NEXT_PUBLIC_GA_ID, "G-767KL5QKKR"),
  fbPixel: pick(process.env.NEXT_PUBLIC_FB_PIXEL_ID, "963493464903338"),
  fbAppId: "1472935092906816",
  fbDomainVerification: "spk838pfadabdtsh46tiiaqprhk167",
};

const ID = /^[A-Za-z0-9-]+$/; // mã chỉ gồm chữ, số, gạch: chặn chèn script qua biến môi trường

/** Script tag: tải sau khi trang tương tác được (không chặn hiển thị). */
export function SiteTagScripts() {
  if (!SITE_TAGS.enabled) return null;
  const { gtm, ga, fbPixel } = SITE_TAGS;
  return (
    <>
      {ID.test(gtm) ? (
        <Script id="hv-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}
      {ID.test(ga) ? (
        <>
          <Script id="hv-ga-src" src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="hv-ga" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      ) : null}
      {/^\d+$/.test(fbPixel) ? (
        <Script id="hv-fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixel}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/** Bản không JS (đầu <body>): iframe GTM và ảnh 1px của Pixel, như web cũ. */
export function SiteTagNoscript() {
  if (!SITE_TAGS.enabled) return null;
  const { gtm, fbPixel } = SITE_TAGS;
  return (
    <noscript>
      {ID.test(gtm) ? <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="gtm" /> : null}
      {/^\d+$/.test(fbPixel) ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh theo dõi 1px của Facebook, không phải ảnh nội dung
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${fbPixel}&ev=PageView&noscript=1`} />
      ) : null}
    </noscript>
  );
}
