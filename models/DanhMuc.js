var mongoose = require('mongoose');

var danhMucSchema = new mongoose.Schema({
    tenDanhMuc: { type: String, required: true },
    duongDanThuongGoi: { type: String, required: true, unique: true }, // Slug, ví dụ: "phan-mem-diet-virus"
    moTa: { type: String },
    danhMucCha_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DanhMuc', default: null } // Dành cho menu đa cấp
});

module.exports = mongoose.model('DanhMuc', danhMucSchema);