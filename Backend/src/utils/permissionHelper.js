const { Op } = require('sequelize');
const ErrorResponse = require('./errorResponse');

/**
 * Cấu hình Phân vùng dữ liệu (ABAC Context)
 * Định nghĩa cách mỗi Entity được lọc và bảo vệ.
 */
const ENTITY_CONFIG = {
    member: {
        branchField: '$UnionCell.unionBranchId$', // Yêu cầu join UnionCell
        cellField: 'unionCellId',
        allowPublic: false // Chỉ xem được trong scope
    },
    cell: {
        branchField: 'unionBranchId',
        cellField: 'id',
        allowPublic: false
    },
    branch: {
        branchField: 'id',
        cellField: null,
        allowPublic: false
    },
    news: {
        branchField: 'unionBranchId',
        cellField: 'unionCellId',
        allowPublic: true // Cho phép xem bài viết cấp Trường (null)
    },
    activity: {
        branchField: 'organizedByBranchId',
        cellField: 'organizedByCellId',
        allowPublic: true
    },
    meeting: {
        branchField: 'organizerBranchId',
        cellField: 'organizerCellId',
        allowPublic: true
    },
    fee: {
        branchField: 'unionBranchId',
        cellField: 'unionCellId',
        allowPublic: false
    },
    transaction: {
        branchField: '$UnionCell.unionBranchId$',
        cellField: 'unionCellId',
        allowPublic: false
    },
    quiz: {
        branchField: 'unionBranchId',
        cellField: 'unionCellId',
        allowPublic: true // Cho phép xem kỳ thi cấp Trường (null)
    }
};

/**
 * Kiểm tra người dùng có một quyền cụ thể không
 */
const hasPermission = (user, permissionCode) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    
    // Đảm bảo trả về boolean tuyệt đối
    return !!(user.permissions && user.permissions.includes(permissionCode));
};

/**
 * Kiểm tra người dùng có một trong các quyền trong danh sách không
 */
const hasAnyPermission = (user, permissionCodes = []) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return permissionCodes.some(code => hasPermission(user, code));
};

/**
 * Kiểm tra và ép buộc phạm vi dữ liệu (Scoping)
 * Dùng cho các bản ghi có trực tiếp unionBranchId hoặc unionCellId
 */
const enforceScope = (user, resource) => {
    if (!user) throw new ErrorResponse('Unauthorized', 401);
    if (user.isSuperAdmin) return true;

    const userBranchId = user.unionBranchId || user.scope?.branchId;
    const userCellId = user.unionCellId || user.scope?.cellId;

    // 1. Kiểm tra phạm vi Chi đoàn (Lớp) - Ưu tiên cao nhất
    if (userCellId && resource.unionCellId && resource.unionCellId !== userCellId) {
        throw new ErrorResponse('Bạn không có quyền thao tác dữ liệu ngoài Chi đoàn quản lý', 403);
    }

    // 2. Kiểm tra phạm vi Liên chi đoàn (Khoa)
    if (userBranchId && resource.unionBranchId && resource.unionBranchId !== userBranchId) {
        throw new ErrorResponse('Bạn không có quyền thao tác dữ liệu ngoài Liên chi đoàn quản lý', 403);
    }
    
    return true;
};

/**
 * Kiểm tra phạm vi lồng nhau (Nested Scope)
 * Dùng khi resource không có ID trực tiếp mà phải thông qua quan hệ (e.g. Member -> Cell -> Branch)
 * CHÚ Ý: Ném lỗi nếu thiếu dữ liệu quan hệ (chưa include)
 */
const enforceNestedScope = (user, resource, path = []) => {
    if (!user) throw new ErrorResponse('Unauthorized', 401);
    if (user.isSuperAdmin) return true;

    const userBranchId = user.unionBranchId || user.scope?.branchId;
    const userCellId = user.unionCellId || user.scope?.cellId;

    let current = resource;
    for (const key of path) {
        if (!current || current[key] === undefined) {
            // RỦI RO: Thiếu dữ liệu quan hệ dẫn tới bypass check
            throw new ErrorResponse(`Lỗi hệ thống: Thiếu dữ liệu phân vùng (${key}). Vui lòng liên hệ Admin.`, 500);
        }
        current = current[key];
    }

    // So khớp với phạm vi người dùng (thường là BranchId hoặc CellId tại đích của path)
    if (userCellId && current !== userCellId && path.includes('unionCellId')) {
        throw new ErrorResponse('Bạn không có quyền thao tác dữ liệu ngoài Chi đoàn quản lý', 403);
    }

    if (userBranchId && current !== userBranchId) {
        throw new ErrorResponse('Bạn không có quyền thao tác dữ liệu ngoài phạm vi quản lý', 403);
    }

    return true;
};

/**
 * Tạo điều kiện lọc (Where clause) theo thực thể và phạm vi của người dùng
 * @param {Object} user - Người dùng hiện tại
 * @param {String} entityType - Loại thực thể (member, cell, branch, news,...)
 */
const getScopeFilter = (user, entityType) => {
    if (!user || user.isSuperAdmin) return {};
    
    const config = ENTITY_CONFIG[entityType];
    if (!config) return {};

    // 1. Lấy ID đơn vị (Quản lý hoặc Thành viên)
    const userBranchId = user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId;
    const userCellId = user.unionCellId || user.scope?.cellId || user.UnionMember?.unionCellId;

    // 2. Nếu thực thể cho phép Public (News, Activity)
    if (config.allowPublic) {
        const conditions = [];
        conditions.push({ [config.branchField || config.cellField]: null }); // Cấp Trường (luôn cho phép)

        if (userCellId && config.cellField) {
            conditions.push({ [config.cellField]: userCellId });
        }
        
        if (userBranchId && config.branchField) {
            conditions.push({ [config.branchField]: userBranchId });
        }

        return { [Op.or]: conditions };
    }

    // 3. Nếu thực thể Private (Member, Cell, Branch) - Yêu cầu phân vùng cứng
    if (userCellId && config.cellField) {
        return { [config.cellField]: userCellId };
    }

    if (userBranchId && config.branchField) {
        return { [config.branchField]: userBranchId };
    }
    
    return { id: '00000000-0000-0000-0000-000000000000' }; // Nil UUID
};

/**
 * Ngăn chặn ID Injection bằng cách xóa sạch và gán lại ID theo phạm vi user
 * @param {Object} data - Request body cần làm sạch
 * @param {Object} user - Người dùng hiện tại
 * @param {String} entityType - Loại thực thể
 */
const injectScope = (data, user, entityType) => {
    if (!user || user.isSuperAdmin) return data;

    const config = ENTITY_CONFIG[entityType];
    if (!config) return data;

    const bField = config.branchField || 'unionBranchId';
    const cField = config.cellField || 'unionCellId';

    // 1. Xóa sạch mọi nỗ lực chèn ID từ bên ngoài (Hard delete fields)
    delete data[bField];
    delete data[cField];
    
    // Xóa thêm các trường mặc định nếu chúng khác bField/cField
    if (bField !== 'unionBranchId') delete data.unionBranchId;
    if (cField !== 'unionCellId') delete data.unionCellId;

    const userBranchId = user.unionBranchId || user.scope?.branchId || user.UnionMember?.UnionCell?.unionBranchId;
    const userCellId = user.unionCellId || user.scope?.cellId || user.UnionMember?.unionCellId;

    // 2. Gán lại ID theo đúng phạm vi của User
    if (userBranchId && bField) data[bField] = userBranchId;
    if (userCellId && cField) data[cField] = userCellId;
    
    // Luôn giữ unionBranchId/unionCellId cho mục đích scoping nếu model có
    if (userBranchId) data.unionBranchId = userBranchId;
    if (userCellId) data.unionCellId = userCellId;

    return data;
};

module.exports = {
    hasPermission,
    hasAnyPermission,
    enforceScope,
    enforceNestedScope,
    getScopeFilter,
    injectScope
};
