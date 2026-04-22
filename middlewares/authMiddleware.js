// Kiểm tra xem đã đăng nhập chưa
var yeuCauDangNhap = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/dangnhap'); 
};

// Kiểm tra xem có phải là Admin/Sales không
var yeuCauAdmin = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.vaiTro === 'QuanTriVien' || req.session.user.vaiTro === 'NhanVien')) {
        return next(); 
    }
    res.status(403).send('Bạn không có quyền truy cập khu vực này!');
};

module.exports = { yeuCauDangNhap, yeuCauAdmin };