var express = require('express');
var router = express.Router();
var DanhMuc = require('../models/DanhMuc');
var SanPham = require('../models/SanPham');
var { yeuCauAdmin } = require('../middlewares/authMiddleware'); // Đừng quên import phân quyền

// =========================================================
// KHU VỰC 1: ROUTER RENDER GIAO DIỆN (HTML) CHO ADMIN
// =========================================================

// 1. GET: Mở trang danh sách Danh Mục (Chỉ Admin mới vào được)
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        // Lấy danh sách danh mục và đếm số lượng sản phẩm (giống đoạn Aggregate cũ của bạn)
        var danhMucs = await DanhMuc.aggregate([
            {
                $lookup: {
                    from: 'sanphams', 
                    localField: '_id', 
                    foreignField: 'danhMuc_id', 
                    as: 'cacSanPham'
                }
            },
            {
                $addFields: {
                    tongSanPham: { $size: '$cacSanPham' },
                    soSanPhamHienThi: {
                        $size: {
                            $filter: {
                                input: '$cacSanPham',
                                as: 'sp',
                                cond: { $eq: ['$$sp.hienThi', true] }
                            }
                        }
                    }
                }
            },
            {
                $project: { cacSanPham: 0 }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        // Render ra file ejs
        res.render('danhmuc', { 
            title: 'Quản Lý Danh Mục',
            danhMucs: danhMucs 
        });
    } catch (error) {
        console.error("Lỗi tải trang danh mục:", error);
        res.status(500).send("Lỗi máy chủ!");
    }
});

// 2. GET: Mở form Thêm Danh Mục
router.get('/them', yeuCauAdmin, (req, res) => {
    res.render('danhmuc_them', { title: 'Thêm Danh Mục' });
});

// 3. GET: Mở form Sửa Danh Mục
router.get('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        var danhMuc = await DanhMuc.findById(req.params.id);
        if (!danhMuc) return res.status(404).send("Không tìm thấy danh mục này");
        
        res.render('danhmuc_sua', { 
            title: 'Sửa Danh Mục',
            danhMuc: danhMuc
        });
    } catch (error) {
        res.status(500).send("Lỗi máy chủ!");
    }
});


// =========================================================
// KHU VỰC 2: CÁC API XỬ LÝ DỮ LIỆU (Thêm, Sửa, Xóa)
// (Các hàm này nhận dữ liệu từ Form và thực thi trên Database)
// =========================================================

// 4. POST: Xử lý Thêm Danh Mục Mới
router.post('/them', yeuCauAdmin, async (req, res) => {
    try {
        var danhMucMoi = new DanhMuc(req.body);
        await danhMucMoi.save();
        res.redirect('/danhmuc'); // Thêm xong thì quay về trang danh sách
    } catch (error) {
        console.error(error);
        res.status(400).send("Lỗi khi thêm danh mục!");
    }
});

// 5. POST: Xử lý Cập Nhật Danh Mục (Dùng POST vì HTML Form chỉ hỗ trợ GET/POST)
router.post('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        var capNhat = await DanhMuc.findByIdAndUpdate(req.params.id, req.body);
        if (!capNhat) return res.status(404).send("Không tìm thấy danh mục để sửa");
        
        res.redirect('/danhmuc'); // Sửa xong thì quay về trang danh sách
    } catch (error) {
        res.status(400).send("Lỗi khi sửa danh mục!");
    }
});

// 6. GET: Xử lý Xóa Danh Mục (Dùng GET để gắn thẳng vào link thẻ <a>)
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
   try {
        var idDanhMuc = req.params.id;

        var sanPhamTonTai = await SanPham.findOne({ danhMuc_id: idDanhMuc });

        if (sanPhamTonTai) {
            return res.send(`
                <script>
                    alert('KHÔNG THỂ XÓA!');
                    window.location.href = '/danhmuc';
                </script>
            `);
        }

        await DanhMuc.findByIdAndDelete(idDanhMuc);
        res.redirect('/danhmuc');

    } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
        res.status(500).send("Lỗi hệ thống khi xóa danh mục!");
    }
});

// 7. API LẤY DANH SÁCH DANH MỤC DẠNG JSON (Phục vụ cho các AJAX fetch nếu cần)
router.get('/api/danhsach', async (req, res) => {
    try {
        var danhMucs = await DanhMuc.find();
        res.status(200).json(danhMucs);
    } catch (error) {
         res.status(500).json({ loi: 'Lỗi máy chủ khi lấy danh mục' });
    }
});

module.exports = router;