var express = require('express');
var router = express.Router();

router.get('/gioi-thieu', (req, res) => {
    res.render('gioithieu', {
        title: 'Giới thiệu về PKStore'
    });
});

router.get('/huong-dan', (req, res) => {
    res.render('huongdan', {
        title: 'Hướng dẫn Mua hàng & Thanh toán'
    });
});

router.get('/chinh-sach', (req, res) => {
    res.render('chinhsach', {
        title: 'Chính sách và Điều khoản - PKStore'
    });
});

router.get('/phuong-thuc-thanh-toan', (req, res) => {
    res.render('phuongthucthanhtoan', {
        title: 'Phương thức thanh toán - PKStore'
    });
});

module.exports = router;