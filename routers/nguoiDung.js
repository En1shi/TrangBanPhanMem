var express = require('express');
var router = express.Router();
var NguoiDung = require('../models/NguoiDung');
var DonHang = require('../models/DonHang');
var bcrypt = require('bcrypt');

// =========================================================
// KHU VỰC 1: QUẢN TRỊ VIÊN (ADMIN) - QUẢN LÝ TÀI KHOẢN
// =========================================================

// 1. GET: Danh sách tài khoản
router.get('/', async (req, res) => {
    try {
        var danhSachNguoiDung = await NguoiDung.find();
        res.render('nguoidung_admin', {
            title: 'Danh Sách Người Dùng',
            NguoiDung: danhSachNguoiDung
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 2. GET: Mở form thêm tài khoản nhân viên
router.get('/them', (req, res) => {
    res.render('nguoidung_them', { title: 'Thêm Nhân Viên' });
});

router.post('/them', async (req, res) => {
    try {
        var { tenDangNhap, hoTen, email, soDienThoai, vaiTro, hinhAnh } = req.body;

        var salt = await bcrypt.genSalt(10);
        var matKhauDaMaHoa = await bcrypt.hash('123456', salt);

        // 3. Tạo Object người dùng mới khớp 100% với Schema
        var nhanVienMoi = new NguoiDung({
            tenDangNhap: tenDangNhap,
            hoTen: hoTen,
            email: email,
            matKhau: matKhauDaMaHoa, 
            soDienThoai: soDienThoai,
            vaiTro: vaiTro,
            trangThai: 'HoatDong', 
            hinhAnh: hinhAnh
        });

        // 4. Lưu vào Database
        await nhanVienMoi.save();

        // 5. Thành công thì quay lại trang danh sách
        res.redirect('/nguoidung');

    } catch (error) {
        console.error("Lỗi khi thêm nhân viên:", error);
        res.status(400).send("Không thể thêm nhân viên: " + error.message); 
    }
});

router.get('/sua/:id', async (req, res) => {
    try {
        var id = req.params.id;
        var nguoiDung = await NguoiDung.findById(id);
        res.render('nguoidung_sua', {
            title: 'Sửa Người Dùng',
            NguoiDung: nguoiDung
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 5. POST: Admin xử lý sửa tài khoản
router.post('/sua/:id', async (req, res) => {
   try {
        var id = req.params.id;

        var { hoTen, email, vaiTro, trangThai, matKhau } = req.body;
        var updateData = {
            hoTen: hoTen,
            email: email,
            vaiTro: vaiTro,
            trangThai: trangThai
        };

        if (matKhau && matKhau.trim() !== '') {
            var salt = await bcrypt.genSalt(10);
            updateData.matKhau = await bcrypt.hash(matKhau, salt);
        }

        await NguoiDung.findByIdAndUpdate(id, updateData);
        
        res.redirect('/nguoidung'); 

    } catch (error) {
        console.error("Lỗi khi cập nhật người dùng:", error);
        res.status(500).send("Lỗi cập nhật: " + error.message);
    }
});

// 6. GET: Xóa tài khoản
router.get('/xoa/:id', async (req, res) => {
    try {
        await NguoiDung.findByIdAndDelete(req.params.id);
        res.redirect('/nguoidung');
    } catch (error) {
        res.status(500).send(error.message);
    }
});


// =========================================================
// KHU VỰC 2: CÁ NHÂN - TỰ CẬP NHẬT THÔNG TIN & ĐỔI MẬT KHẨU
// (Dành cho cả Khách hàng, Nhân viên, Admin tự đổi profile)
// =========================================================

// 7. GET: Mở trang hồ sơ cá nhân
router.get('/thongtin', async (req, res) => {
    try {
        // Lấy ID từ Session của người đang đăng nhập
        var id = req.session.user._id;
        
        // Lấy thông tin chi tiết của User
        var thongTinCaNhan = await NguoiDung.findById(id);

        var lichSu = await DonHang.find({ khachHang_id: id }).sort({ createdAt: -1 });

        res.render('thongtin', {
            title: 'Thông tin cá nhân',
            user: thongTinCaNhan,    // Đổi tên từ thongTinKhach thành user cho khớp file EJS
            lichSuDonHang: lichSu,   // Truyền mảng đơn hàng sang giao diện
            loi: req.query.loi,
            thanhCong: req.query.thanhcong
        });
    } catch (error) {
        console.error("Lỗi tải trang hồ sơ:", error);
        res.status(500).send("Lỗi tải trang cá nhân!");
    }
});

// 8. POST: Xử lý cập nhật thông tin cá nhân
router.post('/thongtin', async (req, res) => {
    try {
        var id = req.session.user._id;
        
        // Lấy dữ liệu từ các ô input gửi lên
        var { hoTen, soDienThoai, matKhauCu, matKhauMoi, xacNhanMatKhau } = req.body;

        var userHienTai = await NguoiDung.findById(id);

        // ĐÃ SỬA: Viết đúng định dạng chữ thường của các cột trong Database
        var duLieuCapNhat = {
            hoTen: hoTen,
            soDienThoai: soDienThoai
        };

        // Nếu người dùng có nhập mật khẩu cũ (tức là muốn đổi mật khẩu)
        if (matKhauCu) {
            // ĐÃ SỬA: Lấy đúng biến userHienTai.matKhau
            var matKhauDung = bcrypt.compareSync(matKhauCu, userHienTai.matKhau);
            if (!matKhauDung) {
                return res.redirect('/nguoidung/thongtin?loi=sai-mat-khau');
            }

            if (matKhauMoi !== xacNhanMatKhau) {
                return res.redirect('/nguoidung/thongtin?loi=khong-khop');
            }

            // Mã hóa mật khẩu mới và lưu vào duLieuCapNhat
            var salt = bcrypt.genSaltSync(10);
            duLieuCapNhat.matKhau = bcrypt.hashSync(matKhauMoi, salt);
        }

        // Thực thi lệnh cập nhật
        var userMoi = await NguoiDung.findByIdAndUpdate(id, duLieuCapNhat, { new: true });

        // Cập nhật lại Session để tên mới lập tức hiển thị lên góc phải Navbar
        req.session.user = userMoi;

        res.redirect('/nguoidung/thongtin?thanhcong=true');
        
    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ cá nhân:", error); // Bổ sung log lỗi để dễ theo dõi
        res.status(500).send("Lỗi cập nhật hồ sơ!");
    }
});

module.exports = router;