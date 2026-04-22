var mongoose = require('mongoose');

var khoBanQuyenSchema = new mongoose.Schema({
    sanPham_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SanPham', required: true },
    maKichHoat: { type: String, required: true, unique: true }, // License Key thực tế
    trangThai: { 
        type: String, 
        enum: ['SanSang', 'DaBan', 'DangGiuCho'], // 'DangGiuCho' khi khách đang ở bước thanh toán
        default: 'SanSang' 
    },
    donHang_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DonHang', default: null }, // Rỗng nếu chưa bán
    nguoiNhap_id: { type: mongoose.Schema.Types.ObjectId, ref: 'NguoiDung' } // Ai là người thêm key này vào kho
}, { timestamps: true });

module.exports = mongoose.model('KhoBanQuyen', khoBanQuyenSchema);