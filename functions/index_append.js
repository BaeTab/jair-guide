
// Jeju Clean House API Proxy
exports.getCleanHouse = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            const { page = 1, perPage = 200 } = req.query;
            const apiUrl = "https://api.odcloud.kr/api/15110514/v1/uddi:037de394-ea6f-40e5-9277-cb7b9e36f5ce";

            // If CLEAN_SERVICE_KEY is URL encoded, it might need to be decoded depending on axios behavior with params.
            // But usually axios handles params encoding. The user provided key looks Base64 encoded (typical for Korean Open APIs).
            // Public Data Portal usually expects the DECODED key if passed as a query parameter in some libraries, or ENCODED if passed as string concatenation.
            // Since we're using axios params, we should generally pass the DECODED key. 
            // Our CLEAN_SERVICE_KEY is already derived via decodeURIComponent(SERVICE_KEY), so it should be the decoded version.

            const response = await axios.get(apiUrl, {
                params: {
                    page: page,
                    perPage: perPage,
                    serviceKey: CLEAN_SERVICE_KEY,
                    returnType: 'JSON'
                },
                timeout: 10000
            });

            res.status(200).json(response.data);
        } catch (error) {
            console.error("Clean House API Error:", error.message);
            // Log full error for debugging
            if (error.response) {
                console.error("Data:", error.response.data);
                console.error("Status:", error.response.status);
            }
            res.status(500).json({ error: "Failed to fetch Clean House data", details: error.message });
        }
    });
});
