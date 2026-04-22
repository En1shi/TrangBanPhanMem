var express = require('express');
var router = express.Router();

var danhMucRouter = require('./danhMuc');
var authRouter = require('./auth');
var sanPhamRouter = require('./sanPham');
var khoBanQuyenRouter = require('./khoBanQuyen');
var donHangRouter = require('./donHang');
var nguoiDungRouter = require('./nguoiDung');
var SanPham = require('../models/SanPham');

// Thiết lập đường dẫn API
router.use('/danhmuc', danhMucRouter);
router.use('/auth', authRouter);
router.use('/sanpham', sanPhamRouter);
router.use('/khobanquyen', khoBanQuyenRouter);
router.use('/donhang', donHangRouter);
router.use('/nguoidung', nguoiDungRouter);

router.get('/error', async (req, res) => {
    console.log(error); // In lỗi ra màn hình đen để bạn dễ sửa
    res.status(500).send("Hệ thống đang bảo trì hoặc gặp sự cố: " + error.message);
});

router.get('/success', async (req, res) => {
    res.render('success', {
        title: 'Hoàn thành'
    });
});

router.get('/', async (req, res) => {
     try {
        var danhSachSanPham = await SanPham.find({ hienThi: true }).limit(8);
        
        res.render('index', { 
            title: 'Trang chủ - PKStore',
            sanPhams: danhSachSanPham 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi tải trang chủ");
    }
});

module.exports = router;