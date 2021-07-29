module.exports = {
    fail: (CODE, MSG) => {
        return {
            CODE,
            message: MSG,
        };
    },
};
