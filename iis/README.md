# Cấu hình IIS cho frontend NOIBO

Đo ngày 2026-09-22: IIS gửi `main.js` (11 MB) **không nén** và **không có
`Cache-Control`**. File `web.config` trong thư mục này bật nén gzip, cho
`static/` cache 1 năm và luôn tải lại `index.html`.

## Áp dụng (trên server 171.237.176.73)

1. **Cài nén file tĩnh** (chỉ cần làm 1 lần). PowerShell chạy quyền Administrator:
   ```powershell
   # Windows Server
   Install-WindowsFeature Web-Stat-Compression
   # Windows 10/11
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
   ```
2. **Đối chiếu `web.config` đang có** trong thư mục site của `noibo.thuanhunglongan.com`
   (file này không có trong repo). Deep link như `/lunch-order/me` đang chạy được,
   nghĩa là file đó đã có rule rewrite. Nếu nó còn cấu hình khác (proxy, header…)
   thì **ghép** phần `urlCompression` và các khối `<location>` từ file ở đây vào,
   đừng thay cả file.
3. Sao lưu `web.config` cũ → đặt file mới → mở thử vài trang.

Không được khai báo thêm `<mimeMap>` cho đuôi file IIS đã biết sẵn: IIS sẽ trả
lỗi 500 cho toàn site.

## Kiểm tra sau khi áp dụng

```bash
curl -sI -H "Accept-Encoding: gzip" https://noibo.thuanhunglongan.com/static/js/<tên main mới>.js
# cần có:  Content-Encoding: gzip
#          Cache-Control: max-age=31536000,immutable
curl -sI https://noibo.thuanhunglongan.com/
# cần có:  Cache-Control: no-cache
```

Muốn nén **brotli** (nhỏ hơn gzip ~20%) thì cài thêm module
[IIS Compression](https://www.iis.net/downloads/microsoft/iis-compression).
Không bắt buộc.
