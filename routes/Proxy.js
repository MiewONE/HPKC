const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        "/v1",
        createProxyMiddleware({
            target: "http://localhost:30000/",
            changeOrigin: true,
            ws: true,
            pathRewrite: {
                "^/v1": "",
            },
        }),
    );
};
