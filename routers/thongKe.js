var express = require('express');
var router = express.Router();
var DonHang = require('../models/DonHang'); // Gọi model vào đây để hết báo lỗi
var { yeuCauAdmin } = require('../middlewares/authMiddleware');

// 1. GET: Render giao diện Thống kê
router.get('/', yeuCauAdmin, (req, res) => {
    res.render('thongke', { title: 'Báo Cáo Thống Kê' });
});

// 2. GET: API trả về dữ liệu (để vẽ biểu đồ bằng AJAX)
router.get('/api/du-lieu', yeuCauAdmin, async (req, res) => {
    try {
        var tongQuan = await DonHang.aggregate([
            { $match: { trangThai: { $in: ['DaThanhToan', 'HoanThanh'] } } },
            {
                $group: {
                    _id: null,
                    tongDoanhThu: { $sum: '$tongTien' },
                    tongSoDon: { $sum: 1 }
                }
            }
        ]);

        var chiTietSanPham = await DonHang.aggregate([
            { $match: { trangThai: { $in: ['DaThanhToan', 'HoanThanh'] } } },
            { $unwind: '$danhSachSanPham' },
            {
                $group: {
                    _id: '$danhSachSanPham.tenSanPham',
                    soLuongBan: { $sum: '$danhSachSanPham.soLuong' }
                }
            },
            { $sort: { soLuongBan: -1 } }
        ]);

        res.status(200).json({
            tongDoanhThu: tongQuan[0]?.tongDoanhThu || 0,
            tongSoDon: tongQuan[0]?.tongSoDon || 0,
            chiTietSanPham: chiTietSanPham
        });
    } catch (error) {
        console.error("Lỗi thống kê:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi lấy dữ liệu thống kê" });
    }
});

module.exports = router;