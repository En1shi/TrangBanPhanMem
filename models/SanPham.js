var mongoose = require('mongoose');

var sanPhamSchema = new mongoose.Schema({
    tenSanPham: { type: String, required: true },
    danhMuc_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', required: true },
    moTaChiTiet: { type: String },
    giaBan: { type: Number, required: true },
    giaGoc: { type: Number },
    hinhAnh: [{ type: String }], // Mảng chứa các đường dẫn (URL) hình ảnh
    cauHinhToiThieu: { type: Object }, // Lưu thông tin RAM, CPU, Hệ điều hành dưới dạng Object
    hienThi: { type: Boolean, default: true } // Bật/tắt hiển thị trên web
}, { timestamps: true });

module.exports = mongoose.model('SanPham', sanPhamSchema);