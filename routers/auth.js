var express = require('express');
var router = express.Router();
var NguoiDung = require('../models/NguoiDung');
var bcrypt = require('bcrypt');

router.get('/dangnhap', async (req, res) => {
    try {
        res.render('dangnhap', {
            title: 'Đăng nhập',
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/dangnhap', async (req, res) => {
    try {
        var { tenDangNhap, matKhau } = req.body;

        if (!tenDangNhap || !matKhau) {
            return res.status(400).json({ loi: 'Vui lòng nhập đầy đủ thông tin!' });
        }
        var user = await NguoiDung.findOne({ 
            $or: [{ TenDangNhap: tenDangNhap }, { tenDangNhap: tenDangNhap }] 
        });

        if (!user) return res.status(401).json({ loi: 'Tài khoản không tồn tại!' });

        var hashTuDatabase = user.MatKhau || user.matKhau;

        if (!hashTuDatabase) {
            return res.status(400).json({ loi: 'Tài khoản này bị lỗi dữ liệu mật khẩu, vui lòng đăng ký lại!' });
        }
        var isMatch = await bcrypt.compare(matKhau, hashTuDatabase);
        if (!isMatch) return res.status(401).json({ loi: 'Mật khẩu không chính xác!' });

        var trangThai = user.TrangThai || user.trangThai;
        if (trangThai === 'BiKhoa') return res.status(403).json({ loi: 'Tài khoản này đã bị khóa!' });

        req.session.user = {
            _id: user._id,
            hoTen: user.HoTen || user.hoTen,
            vaiTro: user.VaiTro || user.vaiTro 
        };

        res.status(200).json({ thongBao: 'Đăng nhập thành công!', vaiTro: req.session.user.vaiTro });

    } catch (error) {
        console.error("Lỗi Đăng Nhập:", error);
        res.status(500).json({ loi: error.message });
    }
});

router.get('/dangky', async (req, res) => {
    try {
        res.render('dangky', {
            title: 'Đăng ký',
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.post('/dangky', async (req, res) => {
    try {
        var { tenDangNhap, email, matKhau, hoTen, soDienThoai } = req.body;

        // 1. Kiểm tra xem Tên đăng nhập hoặc Email đã tồn tại chưa
        var checkUser = await NguoiDung.findOne({
            $or: [{ tenDangNhap: tenDangNhap }, { email: email }]
        });

        if (checkUser) {
            return res.status(400).json({ loi: 'Tên đăng nhập hoặc Email đã được sử dụng!' });
        }

        // 2. Tạo đối tượng khách hàng mới
        var khachHangMoi = new NguoiDung({
            tenDangNhap,
            email,
            matKhau,
            hoTen,
            soDienThoai,
            VaiTro: 'KhachHang',
            TrangThai: 'HoatDong'
        });

        await khachHangMoi.save();

        res.status(201).json({ thongBao: 'Đăng ký tài khoản thành công!' });

    } catch (error) {
        res.status(500).json({ loi: error.message });
    }
});

router.get('/dangxuat', (req, res) => {
// Nếu đang có session user (đã đăng nhập)
    if (req.session.user) {
        // Hủy toàn bộ phiên đăng nhập một cách an toàn
        req.session.destroy((err) => {
            if (err) {
                console.error("Lỗi khi hủy session đăng xuất:", err);
                return res.status(500).send("Không thể đăng xuất, vui lòng thử lại!");
            }
            // Xóa luôn cookie chứa session ID trên trình duyệt (tên mặc định thường là connect.sid)
            res.clearCookie('connect.sid'); 
            
            // Chuyển hướng về trang chủ
            res.redirect('/');
        });
    } else {
        // Nếu chưa đăng nhập mà cố tình gọi link đăng xuất thì cho về trang chủ luôn
        res.redirect('/');
    }
});

module.exports = router;    