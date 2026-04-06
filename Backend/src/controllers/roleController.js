const { Role, Permission, User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Controller cho Quản lý Vai trò và Quyền hạn (RBAC)
 */
const roleController = {
    /**
     * @route GET /api/roles
     * @desc Lấy danh sách tất cả vai trò kèm quyền hạn và số lượng user
     */
    getRoles: asyncHandler(async (req, res) => {
        const roles = await Role.findAll({
            include: [
                {
                    model: Permission,
                    attributes: ['id', 'code', 'name', 'module'],
                    through: { attributes: [] }
                },
                {
                    model: User,
                    attributes: ['id'],
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Format lại dữ liệu để trả về số lượng user
        const formattedRoles = roles.map(role => {
            const roleData = role.toJSON();
            roleData.userCount = role.Users ? role.Users.length : 0;
            delete roleData.Users;
            return roleData;
        });

        res.status(200).json({ success: true, data: formattedRoles });
    }),

    /**
     * @route GET /api/roles/permissions
     * @desc Lấy danh sách tất cả các quyền có sẵn, nhóm theo module
     */
    getPermissions: asyncHandler(async (req, res) => {
        const permissions = await Permission.findAll({
            attributes: ['id', 'code', 'name', 'module'],
            where: { isActive: true },
            order: [['module', 'ASC'], ['name', 'ASC']]
        });

        // Nhóm theo module để Frontend hiển thị dễ dàng
        const grouped = permissions.reduce((acc, p) => {
            const module = p.module || 'Khác';
            if (!acc[module]) acc[module] = [];
            acc[module].push(p);
            return acc;
        }, {});

        res.status(200).json({ success: true, data: grouped });
    }),

    /**
     * @route POST /api/roles
     * @desc Tạo vai trò mới và gán danh sách quyền
     */
    createRole: asyncHandler(async (req, res) => {
        const { code, name, description, permissionIds } = req.body;

        // Kiểm tra mã đã tồn tại chưa
        const existing = await Role.findOne({ where: { code } });
        if (existing) throw new ErrorResponse('Mã vai trò đã tồn tại', 400);

        const role = await Role.create({ code, name, description, isSystem: false });

        // Gán quyền nếu có danh sách permissionIds
        if (permissionIds && Array.isArray(permissionIds)) {
            await role.setPermissions(permissionIds);
        }

        const newRole = await Role.findByPk(role.id, {
            include: [{ model: Permission, through: { attributes: [] } }]
        });

        res.status(201).json({ success: true, data: newRole });
    }),

    /**
     * @route PUT /api/roles/:id
     * @desc Cập nhật thông tin vai trò và đồng bộ lại quyền
     */
    updateRole: asyncHandler(async (req, res) => {
        const { name, description, permissionIds, isActive } = req.body;
        const role = await Role.findByPk(req.params.id);

        if (!role) throw new ErrorResponse('Không tìm thấy vai trò', 404);
        if (role.isSystem && req.body.code && req.body.code !== role.code) {
            throw new ErrorResponse('Không thể sửa mã của vai trò hệ thống', 400);
        }

        await role.update({ 
            name: name || role.name, 
            description: description !== undefined ? description : role.description,
            isActive: isActive !== undefined ? isActive : role.isActive
        });

        // Đồng bộ quyền (Xóa quyền cũ không có trong mảng mới, thêm quyền mới chưa có)
        if (permissionIds && Array.isArray(permissionIds)) {
            await role.setPermissions(permissionIds);
        }

        const updatedRole = await Role.findByPk(role.id, {
            include: [{ model: Permission, through: { attributes: [] } }]
        });

        res.status(200).json({ success: true, data: updatedRole });
    }),

    /**
     * @route DELETE /api/roles/:id
     * @desc Xóa vai trò (Soft delete) nếu không có user nào đang sử dụng
     */
    deleteRole: asyncHandler(async (req, res) => {
        const role = await Role.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['id'] }]
        });

        if (!role) throw new ErrorResponse('Không tìm thấy vai trò', 404);
        
        // Kiểm tra xem có user nào đang gán role này không
        if (role.Users && role.Users.length > 0) {
            throw new ErrorResponse(`Không thể xóa vai trò đang có ${role.Users.length} người dùng sử dụng. Hãy chuyển họ sang vai trò khác trước.`, 400);
        }

        if (role.isSystem) {
            throw new ErrorResponse('Không thể xóa vai trò mặc định của hệ thống', 400);
        }

        await role.destroy(); // Soft delete do paranoid: true

        res.status(200).json({ success: true, message: 'Đã xóa vai trò thành công' });
    })
};

module.exports = roleController;
