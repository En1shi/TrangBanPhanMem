var mongoose = require('mongoose');
var bcrypt = require('bcrypt'); // 1. Gọi thư viện bcrypt

var nguoiDungSchema = new mongoose.Schema({
    tenDangNhap: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    matKhau: { type: String, required: true }, 
    HinhAnh: { type: String },
    hoTen: { type: String, required: true },
    soDienThoai: { type: String },
    vaiTro: { 
        type: String, 
        enum: ['KhachHang', 'NhanVien', 'QuanTriVien'], 
        default: 'KhachHang' 
    },
    trangThai: { 
        type: String, 
        enum: ['HoatDong', 'BiKhoa'], 
        default: 'HoatDong' 
    }
}, { timestamps: true });

nguoiDungSchema.pre('save', async function() {
    var user = this;

    // Chỉ băm mật khẩu nếu mật khẩu bị thay đổi (hoặc mới tạo)
    if (!user.isModified('matKhau')) {
        return; // Thoát hàm sớm, Mongoose sẽ tự đi tiếp
    }

    var salt = await bcrypt.genSalt(10);
    user.matKhau = await bcrypt.hash(user.matKhau, salt);
});

module.exports = mongoose.model('NguoiDung', nguoiDungSchema);