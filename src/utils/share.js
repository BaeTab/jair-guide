/**
 * Share Utility for Marketing
 */

export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
};



export const shareToKakao = ({ title, description, imageUrl, webUrl, items, profileText }) => {
    if (!window.Kakao) {
        console.error('Kakao SDK not loaded');
        alert('카카오 SDK가 로드되지 않았습니다.');
        return;
    }

    if (!window.Kakao.isInitialized()) {
        console.error('Kakao SDK not initialized');
        alert('카카오 SDK가 초기화되지 않았습니다. 앱 키를 확인하세요.');
        return;
    }

    const productionDomain = 'https://jair-guide.web.app';
    const finalUrl = webUrl || productionDomain;
    const finalImageUrl = imageUrl
        ? (imageUrl.startsWith('http') ? imageUrl : productionDomain + imageUrl)
        : `${productionDomain}/og-image.png`;

    console.log('Kakao Share Attempt:', { title, finalUrl, finalImageUrl, items });

    // 메시지 객체 구성
    const messageObj = {
        objectType: 'feed',
        content: {
            title: title || '제주가이드',
            description: description || '제주도 실시간 날씨, 낚시, 생활 정보 종합 가이드',
            imageUrl: finalImageUrl,
            link: {
                mobileWebUrl: finalUrl,
                webUrl: finalUrl,
            },
        },
        buttons: [
            {
                title: '자세히 보기',
                link: {
                    mobileWebUrl: finalUrl,
                    webUrl: finalUrl,
                },
            },
        ],
    };

    // itemContent 추가 (items가 있을 경우)
    if (items && items.length > 0) {
        messageObj.itemContent = {
            profileText: profileText || '🍃 제주바람',
            items: items.slice(0, 5), // 최대 5개 항목
        };
    }

    try {
        window.Kakao.Share.sendDefault(messageObj);
        console.log('Kakao Share sendDefault called successfully');
    } catch (error) {
        console.error('Kakao Share Error:', error);
        alert('카카오 공유 중 오류 발생: ' + error.message);
    }
};
