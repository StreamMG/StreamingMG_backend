exports.success = (data) => ({ success: true, ...data });
exports.error   = (message, code) => ({ success: false, message, code });
