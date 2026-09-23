# IconSets — cả bộ icon, tách khỏi file JS chính

**Không** viết `import * as FaIcons from "react-icons/fa"` rồi tra `FaIcons[tên]`.

Webpack tính "export nào được dùng" cho **cả ứng dụng**, không riêng từng trang.
Chỉ cần một trang (kể cả trang tải lười) tra icon theo tên biến là webpack coi
mọi icon của bộ đó đều được dùng. Khi đó mọi chỗ khác import vài icon lẻ, ví dụ
`import { FaUser } from "react-icons/fa"` ở trang Login, cũng kéo **nguyên bộ**
vào file JS chính. Trước khi sửa, 3 bộ fa/fc/fi làm file chính nặng thêm ~1,6 MB.

Khi cần cả bộ (ô chọn icon, icon lấy từ DB), import từ đây:

```js
import FaIcons from "~/components/IconSets/fa";        // tĩnh — trong trang tải lười
const set = (await import("~/components/IconSets/fc")).default;  // động
```

Các file ở đây dùng `require()` → webpack lấy bản CommonJS (`fa/index.js`), là
một module khác với bản ES (`fa/index.mjs`) mà `import { FaX } from "react-icons/fa"`
dùng. Bản ES nhờ vậy vẫn được lược bỏ icon thừa.

Muốn hiện icon cố định thì luôn import từng icon: `import { FaUser } from "react-icons/fa"`.
