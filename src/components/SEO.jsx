import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, url, objType = 'website', image }) => {
    const siteTitle = '제주가이드';
    const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - 제주 생활/여행의 모든 것`;
    const defaultDesc = '실시간 날씨와 공기질, 낚시 포인트, 클린하우스, 약국, 와이파이 정보까지! 제주 살이에 필요한 모든 정보를 확인하세요.';
    const defaultKeywords = '제주도, 제주날씨, 제주여행, 미세먼지, 낚시포인트, 제주살이, 제주공항';
    const siteUrl = 'https://jair-guide.web.app';
    const fullUrl = url ? `${siteUrl}/${url}` : siteUrl;
    const ogImage = image || `${siteUrl}/og-image.png`;

    return (
        <Helmet>
            {/* 기본 태그 */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDesc} />
            <meta name="keywords" content={keywords || defaultKeywords} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDesc} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:type" content={objType} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDesc} />
            <meta name="twitter:image" content={ogImage} />

            {/* Breadcrumbs JSON-LD (동적 생성) */}
            {url && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "홈",
                                "item": siteUrl
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": title,
                                "item": fullUrl
                            }
                        ]
                    })}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
