/**
 * Hàm lấy tất cả sản phẩm từ API
 * API: https://api.escuelajs.co/api/v1/products
 * @returns {Promise<Array>} Mảng các sản phẩm
 */
async function getAll() {
    const url = 'https://api.escuelajs.co/api/v1/products';
    
    try {
        // Gửi request GET đến API
        const response = await fetch(url);
        
        // Kiểm tra nếu request không thành công
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        
        // Chuyển dữ liệu JSON thành object
        const products = await response.json();
        
        return products;
    } catch (error) {
        // Báo lỗi nếu không lấy được dữ liệu
        console.error('Lỗi khi lấy sản phẩm:', error);
        throw error;
    }
}

// Biến phân trang: trang hiện tại và số dòng mỗi trang
let currentPage = 1;
let itemsPerPage = 10;

// Biến sắp xếp: 'price-asc', 'price-desc', 'title-asc', 'title-desc'
let sortState = null;

/**
 * Hàm hiển thị sản phẩm lên bảng
 * @param {Array} products - Mảng sản phẩm cần hiển thị (đã cắt theo trang)
 */
function renderProducts(products) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Xóa nội dung cũ

    // Duyệt qua từng sản phẩm và tạo dòng trong bảng
    products.forEach((product) => {
        const row = document.createElement('tr');
        
        // Chỉ hiển thị ảnh của chính sản phẩm (không thêm ảnh danh mục vì ảnh danh mục chung cho cả category, không đúng với từng sản phẩm)
        let allImageUrls = [];
        if (product.images && product.images.length > 0) {
            allImageUrls = [...product.images];
        } else if (product.category?.image) {
            // Chỉ dùng ảnh danh mục khi sản phẩm không có ảnh nào
            allImageUrls = [product.category.image];
        }
        // Tạo HTML hiển thị toàn bộ ảnh
        let imagesHtml = '';
        if (allImageUrls.length > 0) {
            imagesHtml = '<div class="product-images">';
            allImageUrls.forEach((imgUrl) => {
                // referrerpolicy="no-referrer" giúp ảnh từ Imgur load được (tránh bị chặn hotlink)
                imagesHtml += `<img src="${imgUrl}" alt="Hình sản phẩm" referrerpolicy="no-referrer" onerror="this.src='https://placehold.co/80x80?text=No+Image'">`;
            });
            imagesHtml += '</div>';
        } else {
            imagesHtml = '<span>Không có hình</span>';
        }

        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.title || '-'}</td>
            <td>${product.price != null ? product.price + ' USD' : '-'}</td>
            <td>${product.category ? product.category.name : '-'}</td>
            <td>${product.description ? product.description.substring(0, 100) + '...' : '-'}</td>
            <td>${imagesHtml}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Lấy danh sách sản phẩm đã lọc theo ô tìm kiếm
 */
function getFilteredProducts() {
    const searchValue = document.getElementById('search-input').value.trim().toLowerCase();
    return allProducts.filter((product) => {
        const title = (product.title || '').toLowerCase();
        return title.includes(searchValue);
    });
}

/**
 * Sắp xếp mảng sản phẩm theo sortState
 * @param {Array} products - Mảng sản phẩm cần sắp xếp
 */
function sortProducts(products) {
    if (!sortState) return [...products];
    const arr = [...products];
    const [field, order] = sortState.split('-');
    const isAsc = order === 'asc';
    arr.sort((a, b) => {
        if (field === 'price') {
            const pa = a.price != null ? a.price : 0;
            const pb = b.price != null ? b.price : 0;
            return isAsc ? pa - pb : pb - pa;
        }
        // field === 'title'
        const ta = (a.title || '').toLowerCase();
        const tb = (b.title || '').toLowerCase();
        const cmp = ta.localeCompare(tb);
        return isAsc ? cmp : -cmp;
    });
    return arr;
}

/**
 * Cập nhật hiển thị: sắp xếp + phân trang + render bảng + cập nhật nút phân trang
 */
function updateDisplay() {
    let filtered = getFilteredProducts();
    filtered = sortProducts(filtered);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Đảm bảo trang hiện tại hợp lệ
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    
    // Cắt mảng theo trang: ví dụ trang 2, mỗi trang 10 → index 10 đến 19
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filtered.slice(startIndex, endIndex);
    
    // Hiển thị sản phẩm của trang hiện tại
    renderProducts(pageProducts);
    
    // Cập nhật thông tin: "Hiển thị 1-10 của 200 sản phẩm"
    const infoEl = document.getElementById('pagination-info');
    if (totalItems === 0) {
        infoEl.textContent = 'Không có sản phẩm nào';
    } else {
        const from = startIndex + 1;
        const to = Math.min(endIndex, totalItems);
        infoEl.textContent = `Hiển thị ${from}-${to} của ${totalItems} sản phẩm`;
    }
    
    // Tạo nút phân trang: Trang trước, số trang, Trang sau
    const buttonsEl = document.getElementById('pagination-buttons');
    let buttonsHtml = '';
    
    buttonsHtml += `<button class="page-btn" data-page="prev" ${currentPage <= 1 ? 'disabled' : ''}>Trước</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        const active = i === currentPage ? ' active' : '';
        buttonsHtml += `<button class="page-btn${active}" data-page="${i}">${i}</button>`;
    }
    
    buttonsHtml += `<button class="page-btn" data-page="next" ${currentPage >= totalPages ? 'disabled' : ''}>Sau</button>`;
    
    buttonsEl.innerHTML = buttonsHtml;
    
    // Gắn sự kiện click cho các nút
    buttonsEl.querySelectorAll('.page-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'prev') currentPage--;
            else if (page === 'next') currentPage++;
            else currentPage = parseInt(page, 10);
            updateDisplay();
        });
    });
}

/**
 * Hàm khởi chạy Dashboard - gọi khi trang load
 */
async function initDashboard() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const tableContainer = document.getElementById('table-container');

    try {
        // Gọi hàm getAll để lấy danh sách sản phẩm
        const products = await getAll();
        
        // Lưu toàn bộ sản phẩm để dùng cho tìm kiếm
        allProducts = products;
        
        // Ẩn loading
        loadingEl.style.display = 'none';
        
        // Hiển thị bảng và cập nhật (có phân trang)
        tableContainer.style.display = 'block';
        itemsPerPage = parseInt(document.getElementById('per-page-select').value, 10);
        currentPage = 1;
        updateDisplay();
        
        console.log(`Đã tải ${products.length} sản phẩm`);
    } catch (error) {
        // Hiển thị thông báo lỗi
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = 'Không thể tải dữ liệu: ' + error.message;
    }
}

// Lưu toàn bộ sản phẩm để dùng cho tìm kiếm (filter mà không cần gọi API lại)
let allProducts = [];

/**
 * Gọi khi ô tìm kiếm thay đổi - reset về trang 1 và cập nhật hiển thị
 */
function handleSearchChange() {
    currentPage = 1;
    updateDisplay();
}

/**
 * Gọi khi bấm nút sắp xếp
 */
function handleSortClick(sortValue) {
    sortState = sortValue;
    currentPage = 1;
    updateDisplay();
}

/**
 * Gọi khi thay đổi số dòng mỗi trang (5, 10, 20)
 */
function handlePerPageChange() {
    itemsPerPage = parseInt(document.getElementById('per-page-select').value, 10);
    currentPage = 1;
    updateDisplay();
}

// Chạy dashboard khi trang được tải xong
document.addEventListener('DOMContentLoaded', () => {
    initDashboard().then(() => {
        // Gắn sự kiện ô tìm kiếm
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchChange);
        }
        // Gắn sự kiện chọn số dòng mỗi trang
        const perPageSelect = document.getElementById('per-page-select');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', handlePerPageChange);
        }
        // Gắn sự kiện nút sắp xếp
        document.querySelectorAll('.sort-btn').forEach((btn) => {
            btn.addEventListener('click', () => handleSortClick(btn.dataset.sort));
        });
    });
});
