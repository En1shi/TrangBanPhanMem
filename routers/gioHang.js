var express = require('express');
var router = express.Router();
var SanPham = require('../models/SanPham');
var DonHang = require('../models/DonHang');
var { yeuCauDangNhap } = require('../middlewares/authMiddleware');

router.get('/', yeuCauDangNhap, (req, res) => {
    var cart = req.session.cart || [];
    var tongTien = cart.reduce((tong, item) => tong + (item.giaBan * item.soLuong), 0);

    res.render('giohang', {
        title: 'Giỏ hàng của bạn',
        cart: cart,
        tongTien: tongTien
    });
});

// 2. GET: Trang Thanh toán
router.get('/thanhtoan', yeuCauDangNhap, (req, res) => {
    var cart = req.session.cart || [];

    // Nếu giỏ hàng trống mà cố tình vào trang thanh toán thì đuổi về giỏ hàng
    if (cart.length === 0) {
        return res.redirect('/giohang');
    }

    var tongTien = cart.reduce((tong, item) => tong + (item.giaBan * item.soLuong), 0);

    res.render('thanhtoan', {
        title: 'Thanh Toán Đơn Hàng',
        cart: cart,
        tongTien: tongTien
    });
});

// =========================================================
// KHU VỰC 2: API XỬ LÝ DỮ LIỆU (AJAX)
// =========================================================

// 3. API: Thêm sản phẩm vào giỏ
router.post('/api/them', yeuCauDangNhap, async (req, res) => {
    try {
        var { sanPham_id, soLuong } = req.body;
        if (!req.session.cart) req.session.cart = [];

        var sanPham = await SanPham.findById(sanPham_id);
        if (!sanPham || !sanPham.hienThi) {
            return res.status(404).json({ loi: "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh" });
        }

        var cart = req.session.cart;
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa
        var index = cart.findIndex(item => item.sanPham_id === sanPham_id);

        if (index !== -1) {
            // Nếu có rồi thì cộng dồn số lượng
            cart[index].soLuong += Number(soLuong || 1);
        } else {
            // Nếu chưa có thì thêm mới vào mảng
            cart.push({
                sanPham_id: sanPham._id.toString(),
                tenSanPham: sanPham.tenSanPham,
                hinhAnh: sanPham.hinhAnh[0] || 'default.png',
                giaBan: sanPham.giaBan,
                soLuong: Number(soLuong || 1)
            });
        }

        // Tính lại tổng số lượng hiển thị lên cục Badge màu đỏ
        var cartCount = cart.reduce((tong, item) => tong + item.soLuong, 0);
        res.status(200).json({ thongBao: "Đã thêm vào giỏ", cartCount: cartCount });

    } catch (error) {
        console.error("Lỗi thêm giỏ hàng:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi thêm giỏ hàng" });
    }
});

router.post('/api/dat-hang', yeuCauDangNhap, async (req, res) => {
    try {
        var cart = req.session.cart || [];
        if (cart.length === 0) {
            return res.status(400).json({ loi: "Giỏ hàng đang trống!" });
        }

        var { hoTen, email, soDienThoai, ghiChu, phuongThucThanhToan } = req.body;
        var tongTien = cart.reduce((tong, item) => tong + (item.giaBan * item.soLuong), 0);

        // Tạo đơn hàng mới
        var donHangMoi = new DonHang({
            khachHang_id: req.session.user._id,
            hoTen: hoTen,
            email: email,
            soDienThoai: soDienThoai,
            ghiChu: ghiChu,
            phuongThucThanhToan: phuongThucThanhToan,
            danhSachSanPham: cart, // Lưu toàn bộ mảng giỏ hàng vào đơn
            tongTien: tongTien,
            trangThai: 'ChoThanhToan' // Mặc định đơn mới là chờ thanh toán
        });

        await donHangMoi.save();

        // Đặt hàng thành công thì XÓA sạch giỏ hàng hiện tại
        req.session.cart = [];

        res.status(200).json({ thongBao: "Đặt hàng thành công!" });

    } catch (error) {
        console.error("Lỗi đặt hàng:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi tạo đơn hàng!" });
    }
});

router.put('/api/cap-nhat', yeuCauDangNhap, (req, res) => {
    try {
        var { sanPham_id, soLuong } = req.body;
        
        // Bọc lót: Khởi tạo giỏ nếu chưa có
        if (!req.session.cart) req.session.cart = [];
        var cart = req.session.cart;

        var index = cart.findIndex(item => item.sanPham_id === sanPham_id);
        if (index !== -1) {
            if (soLuong > 0) {
                cart[index].soLuong = parseInt(soLuong);
            } else {
                // Nếu số lượng = 0 thì xóa luôn khỏi giỏ
                cart.splice(index, 1);
            }
        }
        
        // Tính lại tổng số lượng hiển thị lên Badge đỏ
        var cartCount = cart.reduce((tong, item) => tong + item.soLuong, 0);
        res.status(200).json({ thongBao: 'Đã cập nhật giỏ hàng', cartCount: cartCount });
        
    } catch (error) {
        console.error("Lỗi cập nhật giỏ:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi cập nhật giỏ hàng" });
    }
});

// 5. API: Xóa sản phẩm khỏi giỏ
router.delete('/api/xoa/:id', yeuCauDangNhap, (req, res) => {
    try {
        var sanPham_id = req.params.id;
        
        // Bọc lót: Khởi tạo giỏ nếu chưa có
        if (!req.session.cart) req.session.cart = [];

        // Lọc bỏ sản phẩm cần xóa
        req.session.cart = req.session.cart.filter(item => item.sanPham_id !== sanPham_id);
        
        // Tính lại tổng số lượng hiển thị lên Badge đỏ
        var cartCount = req.session.cart.reduce((tong, item) => tong + item.soLuong, 0);
        res.status(200).json({ thongBao: 'Đã xóa sản phẩm', cartCount: cartCount });
        
    } catch (error) {
        console.error("Lỗi xóa giỏ hàng:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi xóa sản phẩm khỏi giỏ" });
    }
});

module.exports = router;