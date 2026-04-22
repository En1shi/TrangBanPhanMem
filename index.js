var express = require('express');
var app = express();
var session = require('express-session');
var mongoose = require('mongoose');
var path = require('path');
var indexRouter = require('./routers/index');
var authRouter = require('./routers/auth');
var danhMucRouter = require('./routers/danhMuc');
var sanPhamRouter = require('./routers/sanPham');
var khobanquyenRouter = require('./routers/khoBanQuyen');
var donHangRouter = require('./routers/donHang');
var nguoiDungRouter = require('./routers/nguoiDung');
var gioHangRouter = require('./routers/gioHang');
var thongKeRouter = require('./routers/thongKe');
var trangTinhRouter = require('./routers/trangTinh');

var uri = 'mongodb://admin:admin47@ac-pagi7or-shard-00-01.gyba6hg.mongodb.net:27017/PKStore?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log('Đã kết nối thành công tới MongoDB.'))
    .catch(err => console.log(err));

var { yeuCauDangNhap, yeuCauAdmin } = require('./middlewares/authMiddleware');

app.use(session({
    secret: '1234',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    res.locals.cartCount = req.session.cart.reduce((tong, sp) => tong + sp.soLuong, 0);

    next();
});

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.get('/admin', yeuCauAdmin, (req, res) => {
    res.render('dashboard', { title: 'Bảng Điều Khiển Admin' });
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/', trangTinhRouter);
app.use('/danhmuc', danhMucRouter);
app.use('/nguoidung', nguoiDungRouter);
app.use('/sanpham', sanPhamRouter);
app.use('/khobanquyen', khobanquyenRouter);
app.use('/donhang', donHangRouter);
app.use('/giohang', gioHangRouter);
app.use('/thongke', thongKeRouter);

app.listen(3000, () => {
    console.log('Máy chủ đang chạy tại http://127.0.0.1:3000/');
});