var express = require('express');
var router = express.Router();
var SanPham = require('../models/SanPham');
var DanhMuc = require('../models/DanhMuc');
var KhoBanQuyen = require('../models/KhoBanQuyen');
var { yeuCauAdmin } = require('../middlewares/authMiddleware');

// Cấu hình Multer để upload hình ảnh (Giữ nguyên của bạn)
var multer = require('multer');
var path = require('path');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
var fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ hỗ trợ định dạng hình ảnh!'), false);
    }
};
var upload = multer({ storage: storage, fileFilter: fileFilter });


// =========================================================
// KHU VỰC 1: ROUTER CHO NGƯỜI DÙNG (CLIENT)
// =========================================================

// 1. GET: Trang danh sách sản phẩm (Kết hợp lọc Danh mục & Giá)
router.get('/danhsach', async (req, res) => {
    try {
        // Lấy tham số từ URL (Query String)
        var { danhmuc, mucGia } = req.query;

        // Bộ lọc mặc định: Chỉ hiện sản phẩm được cho phép hiển thị
        let dieuKienLoc = { hienThi: true };

        // Lọc theo danh mục nếu có
        if (danhmuc) {
            dieuKienLoc.danhMuc_id = danhmuc;
        }

        // Lọc theo khoảng giá nếu có
        if (mucGia) {
            if (mucGia === 'duoi-500') {
                dieuKienLoc.giaBan = { $lt: 500000 };
            } else if (mucGia === '500-1000') {
                dieuKienLoc.giaBan = { $gte: 500000, $lte: 1000000 };
            } else if (mucGia === 'tren-1000') {
                dieuKienLoc.giaBan = { $gt: 1000000 };
            }
        }

        var danhMucs = await DanhMuc.find();
        var sanPhams = await SanPham.find(dieuKienLoc).sort({ createdAt: -1 });

        res.render('sanpham', {
            title: 'Tất cả phần mềm - PKStore',
            danhMucs: danhMucs,
            sanPhams: sanPhams,
            danhMucHienTai: danhmuc,
            mucGiaHienTai: mucGia
        });

    } catch (error) {
        console.error("Lỗi trang danh sách sản phẩm:", error);
        res.status(500).send("Lỗi hệ thống khi tải danh sách sản phẩm!");
    }
});

// 2. GET: Trang chi tiết sản phẩm
router.get('/chi-tiet/:id', async (req, res) => {
    try {
        var id = req.params.id;
        
        // Kiểm tra ID hợp lệ
        if (!require('mongoose').Types.ObjectId.isValid(id)) {
            return res.status(404).send("Sản phẩm không hợp lệ!");
        }

        var sanPham = await SanPham.findById(id).populate('danhMuc_id');

        // Kiểm tra tồn tại và quyền hiển thị
        if (!sanPham || !sanPham.hienThi) {
            return res.status(404).send("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.");
        }

        // Lấy sản phẩm cùng loại (Gợi ý)
        var spCungLoai = await SanPham.find({
            danhMuc_id: sanPham.danhMuc_id._id,
            _id: { $ne: sanPham._id },
            hienThi: true
        }).limit(4);

        res.render('chitiet', {
            title: sanPham.tenSanPham,
            sanPham: sanPham,
            spCungLoai: spCungLoai
        });

    } catch (error) {
        console.error("Lỗi trang chi tiết:", error);
        res.status(500).send("Lỗi máy chủ!");
    }
});

// =========================================================
// KHU VỰC 1: ROUTER RENDER GIAO DIỆN (HTML) CHO ADMIN
// =========================================================

// 1. GET: Mở trang Quản lý Sản Phẩm
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        // Lấy danh sách SP và nối với bảng Danh Mục để lấy tên.
        // QUAN TRỌNG: Thêm .lean() để chuyển từ Mongoose Object sang dạng JSON cơ bản mới gắn thêm biến cờ được
        var danhSach = await SanPham.find()
            .populate('danhMuc_id', 'tenDanhMuc')
            .sort({ createdAt: -1 })
            .lean(); 

        // Vòng lặp: Kiểm tra từng sản phẩm xem có Key trong kho không
        for (let sp of danhSach) {
            var keyTonTai = await KhoBanQuyen.findOne({ sanPham_id: sp._id });
            // Gắn cờ coKeyBanQuyen
            sp.coKeyBanQuyen = keyTonTai ? true : false;
        }

        res.render('sanpham_admin', {
            title: 'Quản Lý Sản Phẩm',
            sanPhams: danhSach
        });
    } catch (error) {
        res.status(500).send("Lỗi tải trang sản phẩm!");
    }
});

// 2. GET: Mở trang Thêm Sản Phẩm
router.get('/them', yeuCauAdmin, async (req, res) => {
    try {
        // Phải lấy danh sách danh mục truyền ra Form để Admin chọn
        var danhMucs = await DanhMuc.find();
        res.render('sanpham_them', {
            title: 'Thêm Sản Phẩm Mới',
            danhMucs: danhMucs
        });
    } catch (error) {
        res.status(500).send("Lỗi tải trang thêm sản phẩm!");
    }
});

// 3. GET: Mở trang Sửa Sản Phẩm
router.get('/sua/:id', yeuCauAdmin, async (req, res) => {
    try {
        var sanPham = await SanPham.findById(req.params.id);
        var danhMucs = await DanhMuc.find(); // Vẫn cần danh mục để làm Form

        if (!sanPham) return res.status(404).send("Không tìm thấy sản phẩm");

        res.render('sanpham_sua', {
            title: 'Sửa Sản Phẩm',
            sanPham: sanPham,
            danhMucs: danhMucs
        });
    } catch (error) {
        res.status(500).send("Lỗi tải trang sửa sản phẩm!");
    }
});


// =========================================================
// KHU VỰC 2: XỬ LÝ DỮ LIỆU (THÊM, SỬA, XÓA TỪ FORM)
// =========================================================

// 4. POST: Xử lý Thêm Sản Phẩm (Hứng file ảnh)
router.post('/them', yeuCauAdmin, upload.single('hinhAnh'), async (req, res) => {
    try {
        // Chuyển đổi dữ liệu từ Form (String) thành Object
        let cauHinhToiThieu = {};
        if (req.body.cauHinhToiThieu) {
            // Dùng try-catch phòng trường hợp Admin nhập sai định dạng JSON
            try { cauHinhToiThieu = JSON.parse(req.body.cauHinhToiThieu); } catch (e) {}
        }

        var payload = {
            tenSanPham: req.body.tenSanPham,
            danhMuc_id: req.body.danhMuc_id,
            moTaChiTiet: req.body.moTaChiTiet,
            giaBan: Number(req.body.giaBan),
            giaGoc: req.body.giaGoc ? Number(req.body.giaGoc) : null,
            hienThi: req.body.hienThi === 'true' || req.body.hienThi === 'on', // Checkbox HTML thường gửi value là 'on'
            cauHinhToiThieu: cauHinhToiThieu
        };

        // Nếu có upload ảnh thì lưu tên ảnh
        if (req.file) {
            payload.hinhAnh = [req.file.filename]; 
        }

        var sanPhamMoi = new SanPham(payload);
        await sanPhamMoi.save();
        
        res.redirect('/sanpham'); // Thành công thì quay về trang danh sách
    } catch (error) {
        console.error(error);
        res.status(400).send("Lỗi khi thêm sản phẩm: " + error.message);
    }
});

// 5. POST: Xử lý Cập Nhật Sản Phẩm (Đổi PUT thành POST để HTML Form gọi được)
router.post('/sua/:id', yeuCauAdmin, upload.single('hinhAnh'), async (req, res) => {
    try {
        let cauHinhToiThieu = {};
        if (req.body.cauHinhToiThieu) {
            try { cauHinhToiThieu = JSON.parse(req.body.cauHinhToiThieu); } catch (e) {}
        }

        var updateData = {
            tenSanPham: req.body.tenSanPham,
            danhMuc_id: req.body.danhMuc_id,
            moTaChiTiet: req.body.moTaChiTiet,
            giaBan: Number(req.body.giaBan),
            giaGoc: req.body.giaGoc ? Number(req.body.giaGoc) : null,
            hienThi: req.body.hienThi === 'true' || req.body.hienThi === 'on', 
            cauHinhToiThieu: cauHinhToiThieu
        };

        // Nếu Admin CÓ chọn ảnh mới thì mới cập nhật trường hinhAnh
        // Nếu không chọn ảnh (req.file rỗng), sẽ giữ nguyên ảnh cũ trong DB
        if (req.file) {
            updateData.hinhAnh = [req.file.filename];
        }

        await SanPham.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/sanpham');
    } catch (error) {
        console.error(error);
        res.status(400).send("Lỗi khi sửa sản phẩm!");
    }
});

// 6. GET: Xóa sản phẩm
router.get('/xoa/:id', yeuCauAdmin, async (req, res) => {
    try {
        var idCanXoa = req.params.id;

        // BƯỚC 1: Lớp phòng thủ - Kiểm tra xem có key nào trong kho không
        var kiemTraKho = await KhoBanQuyen.findOne({ sanPham_id: idCanXoa });
        
        // BƯỚC 2: Nếu có key, lập tức bật cảnh báo và đẩy về lại trang
        if (kiemTraKho) {
            return res.send(`
                <script>
                    alert('KHÔNG THỂ XÓA!');
                    window.location.href = '/sanpham';
                </script>
            `);
        }

        // BƯỚC 3: Xóa sản phẩm nếu vượt qua được bước trên
        await SanPham.findByIdAndDelete(idCanXoa);
        res.redirect('/sanpham');
    } catch (error) {
        res.status(500).send("Lỗi khi xóa sản phẩm!");
    }
});

// 7. API LẤY DANH SÁCH (Dành cho các trang hiển thị ngoài Frontend cần AJAX)
router.get('/api/danhsach', async (req, res) => {
    try {
        var danhSach = await SanPham.find().populate('danhMuc_id', 'tenDanhMuc');
        res.status(200).json(danhSach);
    } catch (error) {
        res.status(500).json({ loi: error.message });
    }
});

module.exports = router;