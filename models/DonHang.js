var mongoose = require('mongoose');

var donHangSchema = new mongoose.Schema({
    // Nếu khách đã đăng nhập thì lưu ID, nếu khách vãng lai thì để null
    khachHang_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung', default: null },
    hoTen: { type: String, required: true },
    email: { type: String, required: true },
    soDienThoai: { type: String, required: true },

    // Lưu lại "bản chụp" của giỏ hàng lúc đặt mua để tránh việc giá sản phẩm bị đổi sau này
    danhSachSanPham: [{
        sanPham_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham' },
        tenSanPham: String,
        giaBan: Number,
        soLuong: Number
    }],
    tongTien: { type: Number, required: true },
    phuongThucThanhToan: { type: String, enum: ['ChuyenKhoan', 'Momo'], default: 'ChuyenKhoan' },

    // Các trạng thái của đơn hàng số
    trangThai: {
        type: String,
        enum: ['ChoThanhToan', 'DaThanhToan', 'HoanThanh', 'DaHuy'],
        default: 'ChoThanhToan'
    },

    loiBaoCao: {
        type: String,
        default: null // Mặc định là null (không có lỗi)
    },

    ghiChu: { type: String }

    
}, { timestamps: true });

module.exports = mongoose.model('DonHang', donHangSchema);