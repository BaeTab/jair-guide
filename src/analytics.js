/**
 * Analytics utility for tracking user behavior and marketing effectiveness.
 */

export const logEvent = (eventName, params = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, {
            ...params,
            platform: 'web_guide',
            timestamp: new Date().toISOString()
        });
        console.log(`[Analytics] Event: ${eventName}`, params);
    }
};

export const trackPageView = (pageName) => {
    logEvent('page_view_custom', { page_path: pageName });
};

export const trackFeatureUse = (featureName) => {
    logEvent('feature_use', { feature_id: featureName });
};

export const trackShare = (method, content) => {
    logEvent('share', {
        method: method,
        content_type: content,
        location: 'jeju'
    });
};
