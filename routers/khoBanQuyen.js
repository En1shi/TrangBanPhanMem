var express = require('express');
var router = express.Router();
var KhoBanQuyen = require('../models/KhoBanQuyen');
var SanPham = require('../models/SanPham'); 
var { yeuCauAdmin } = require('../middlewares/authMiddleware');

// 1. GET: Mở trang Quản lý Kho Key
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        var danhSachSanPham = await SanPham.find({ hienThi: true });

        res.render('khobanquyen', { 
            title: 'Quản lý Kho Key Bản Quyền',
            sanPhams: danhSachSanPham 
        });
    } catch (error) {
        console.error("Lỗi tải trang kho key:", error);
        res.status(500).send("Lỗi máy chủ!");
    }
});

// 2. Lấy danh sách (Sửa API thành có dấu gạch ngang cho khớp EJS)
router.get('/api/danhsach', yeuCauAdmin, async (req, res) => {
    try {
        var danhSachKey = await KhoBanQuyen.find()
            .populate('sanPham_id', 'tenSanPham') 
            .sort({ createdAt: -1 });
        res.status(200).json(danhSachKey);
    } catch (error) {
        res.status(500).json({ loi: error.message });
    }
});

// 3. API: Thêm Key
router.post('/api/them', yeuCauAdmin, async (req, res) => {
    try {
        var keyMoi = new KhoBanQuyen({
            sanPham_id: req.body.sanPham_id,
            maKichHoat: req.body.maKey, 
            trangThai: req.body.trangThai || 'SanSang' 
        });
        await keyMoi.save();
        res.status(201).json({ thongBao: "Đã thêm Key thành công!", data: keyMoi });
    } catch (error) {
        res.status(400).json({ loi: "Lỗi thêm Key: " + error.message });
    }
});

// 4. API: Cập nhật Key
router.put('/api/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        var keyCapNhat = await KhoBanQuyen.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ thongBao: "Cập nhật thành công!", data: keyCapNhat });
    } catch (error) {
        res.status(400).json({ loi: "Lỗi cập nhật Key" });
    }
});

// 5. API: Xóa Key
router.delete('/api/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        await KhoBanQuyen.findByIdAndDelete(req.params.id);
        res.status(200).json({ thongBao: "Đã xóa Key thành công!" });
    } catch (error) {
        res.status(500).json({ loi: "Lỗi xóa Key" });
    }
});

module.exports = router;