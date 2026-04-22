var express = require('express');
var router = express.Router();
var DonHang = require('../models/DonHang'); // Đảm bảo bạn đã có file model này
var KhoBanQuyen = require('../models/KhoBanQuyen');
var sendEmail = require('../utils/sendEmail');
var { yeuCauAdmin, yeuCauDangNhap } = require('../middlewares/authMiddleware');

// =========================================================
// KHU VỰC 1: ROUTER RENDER GIAO DIỆN
// =========================================================

// 1. GET: Mở trang Quản lý Đơn Hàng (Dành cho Admin)
router.get('/', yeuCauAdmin, async (req, res) => {
    try {
        // Tương tự các trang trước, bạn có thể truyền thêm dữ liệu ra ejs nếu cần
        // Hoặc chỉ render giao diện và dùng AJAX gọi dữ liệu sau
        res.render('donhang_admin', { title: 'Quản lý Đơn Hàng - Admin' });
    } catch (error) {
        res.status(500).send("Lỗi tải trang quản lý đơn hàng!");
    }
});

// (Tùy chọn) GET: Trang Lịch sử mua hàng (Dành cho Khách hàng)
router.get('/lich-su', yeuCauDangNhap, async (req, res) => {
    try {
        res.render('lichsu_donhang', { title: 'Lịch sử mua hàng' });
    } catch (error) {
        res.status(500).send("Lỗi tải trang lịch sử!");
    }
});


// =========================================================
// KHU VỰC 2: CÁC API XỬ LÝ DỮ LIỆU (Nhận AJAX từ Frontend)
// =========================================================

// 2. API: Lấy danh sách tất cả đơn hàng (Admin)
router.get('/api/danhsach', yeuCauAdmin, async (req, res) => {
    try {
        var danhSach = await DonHang.find().sort({ createdAt: -1 }); // Mới nhất lên đầu
        res.status(200).json(danhSach);
    } catch (error) {
        res.status(500).json({ loi: error.message });
    }
});

// 3. API: Lấy chi tiết 1 đơn hàng
router.get('/api/chitiet/:id', yeuCauDangNhap, async (req, res) => {
    try {
        var donHang = await DonHang.findById(req.params.id);
        if (!donHang) return res.status(404).json({ loi: "Không tìm thấy đơn hàng" });
        res.status(200).json(donHang);
    } catch (error) {
        res.status(500).json({ loi: error.message });
    }
});

router.put('/api/xu-ly-loi/:id', yeuCauAdmin, async (req, res) => {
    try {
        await DonHang.findByIdAndUpdate(req.params.id, { loiBaoCao: "" });
        res.status(200).json({ thongBao: "Đã xử lý xong lỗi" });
    } catch (error) {
        res.status(400).json({ loi: "Lỗi hệ thống" });
    }
});

router.put('/api/bao-loi/:id', yeuCauDangNhap, async (req, res) => {
    try {
        var idDonHang = req.params.id;
        var { noiDungLoi } = req.body;

        await DonHang.findByIdAndUpdate(idDonHang, { loiBaoCao: noiDungLoi });

        res.status(200).json({ thongBao: "Đã gửi báo cáo thành công! Admin sẽ sớm hỗ trợ bạn." });
    } catch (error) {
        console.error("Lỗi khi gửi báo cáo:", error);
        res.status(500).json({ loi: "Lỗi hệ thống khi gửi báo cáo sự cố!" });
    }
});

router.put('/api/cap-nhat-trang-thai/:id', yeuCauAdmin, async (req, res) => {
    try {
        var trangThaiMoi = req.body.trangThai;
        
        // Lấy thông tin đơn hàng hiện tại (chưa cập nhật vội)
        var donHang = await DonHang.findById(req.params.id);
        if (!donHang) return res.status(404).json({ loi: "Không tìm thấy đơn hàng!" });

        // ====================================================================
        // NẾU LÀ "DUYỆT ĐƠN": KIỂM TRA KHO, TRỪ KEY VÀ GỬI EMAIL CHỨA REAL KEY
        // ====================================================================
        if (trangThaiMoi === 'DaThanhToan' && donHang.trangThai === 'ChoThanhToan') {
            
            // 1. KIỂM TRA PRE-CHECK: Trong kho có đủ Key cho toàn bộ giỏ hàng không?
            for (let sp of donHang.danhSachSanPham) {
                let soKeySanSang = await KhoBanQuyen.countDocuments({
                    sanPham_id: sp.sanPham_id,
                    trangThai: 'SanSang'
                });
                
                if (soKeySanSang < sp.soLuong) {
                    return res.status(400).json({ loi: `TỪ CHỐI DUYỆT! Phần mềm "${sp.tenSanPham}" cần ${sp.soLuong} Key, nhưng trong kho chỉ còn ${soKeySanSang} Key hợp lệ. Vui lòng thêm Key trước.` });
                }
            }

            // 2. LẤY KEY VÀ CẬP NHẬT TRẠNG THÁI KEY SANG "ĐÃ BÁN"
            let danhSachSanPhamHTML = '';

            for (let sp of donHang.danhSachSanPham) {
                // Lấy đúng số lượng Key cần thiết
                let cacKeyDuocCap = await KhoBanQuyen.find({
                    sanPham_id: sp.sanPham_id,
                    trangThai: 'SanSang'
                }).limit(sp.soLuong);

                let keysHTML = '';

                // Đổi trạng thái các Key này thành "Đã Bán" (DaBan)
                for (let keyDoc of cacKeyDuocCap) {
                    await KhoBanQuyen.findByIdAndUpdate(keyDoc._id, { trangThai: 'DaBan' });
                    
                    // Tạo khối HTML để hiển thị Key trong email
                    keysHTML += `<div style="font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: bold; color: #d9534f; background: #fff4f4; padding: 6px 12px; margin: 5px 5px 0 0; border-radius: 4px; border: 1px dashed #d9534f; display: inline-block;">${keyDoc.maKichHoat}</div>`;
                }

                // Chèn vào danh sách sản phẩm của email
                danhSachSanPhamHTML += `
                    <li style="margin-bottom: 15px;">
                        <strong>${sp.tenSanPham}</strong> (Số lượng: ${sp.soLuong})
                        <br>
                        <div style="margin-top: 5px;">${keysHTML}</div>
                    </li>
                `;
            }

            // 3. THIẾT KẾ VÀ GỬI EMAIL
            var linkDownload = "https://drive.google.com/file/d/1dYKtE_4HeZOkAq1OgSSkVa27qiDl5hP8/view?usp=drive_link";

            var noiDungEmail = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f4f7f6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border-top: 5px solid #d9534f; box-shadow: 0 10px 20px rgba(0,0,0,0.05);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #d9534f; margin: 0; font-size: 24px;">THANH TOÁN THÀNH CÔNG!</h1>
                            <p style="color: #777;">Đơn hàng: <strong>DH-${donHang._id.toString().slice(-5).toUpperCase()}</strong></p>
                        </div>

                        <p>Chào <strong>${donHang.hoTen}</strong>,</p>
                        <p>PKStore xác nhận bạn đã thanh toán thành công. Dưới đây là mã kích hoạt bản quyền dành cho bạn:</p>
                        
                        <div style="background-color: #fff8f8; border: 1px solid #ffcccc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Danh sách License Key:</h3>
                            <ul style="padding-left: 20px; margin-bottom: 0;">${danhSachSanPhamHTML}</ul>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <p style="margin-bottom: 15px; font-weight: bold;">Vui lòng tải bộ cài đặt tại đây:</p>
                            <a href="${linkDownload}" target="_blank" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 50px; display: inline-block; box-shadow: 0 4px 15px rgba(0,123,255,0.3);">
                                <i class="bi bi-download"></i> TẢI XUỐNG ỨNG DỤNG
                            </a>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.6;">
                            Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của PKStore.
                        </p>
                    </div>
                </div>
            `;

            await sendEmail(donHang.email, "Mã kích hoạt phần mềm - PKStore", noiDungEmail);
        }

        // Bước cuối: Cập nhật trạng thái đơn hàng trong Database
        donHang.trangThai = trangThaiMoi;
        await donHang.save();

        res.status(200).json({ thongBao: "Cập nhật thành công!" });
    } catch (error) {
        console.error("Lỗi duyệt đơn:", error);
        res.status(400).json({ loi: "Lỗi hệ thống khi cập nhật đơn hàng!" });
    }
});

module.exports = router;