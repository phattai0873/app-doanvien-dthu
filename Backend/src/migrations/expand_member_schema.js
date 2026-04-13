/**
 * Migration script - Expand UnionMember schema and create new related tables
 * 3-step safe migration: Initialize -> Migrate Data -> Verify & Preserve
 * Run: node src/migrations/expand_member_schema.js
 */

require('dotenv').config();
const { sequelize } = require('../configs/db');
const { DataTypes } = require('sequelize');
const crypto = require('crypto');
const { encrypt } = require('../utils/crypto');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // --- BƯỚC 1: CẬP NHẬT BẢNG UNION_MEMBERS ---
        console.log('⏳ Đang cập nhật bảng union_members...');
        const memberColumns = await queryInterface.describeTable('union_members');
        
        const newMemberFields = {
            ethnicity: { type: DataTypes.STRING, defaultValue: 'Kinh' },
            religion: { type: DataTypes.STRING, defaultValue: 'Không' },
            professionalLevel: { type: DataTypes.STRING },
            itLevel: { type: DataTypes.STRING },
            languageLevel: { type: DataTypes.STRING },
            memberType: { 
                type: DataTypes.ENUM('STUDENT', 'STAFF', 'TEACHER', 'OTHER'), 
                defaultValue: 'STUDENT' 
            },
            isHonoraryMember: { type: DataTypes.BOOLEAN, defaultValue: false }
        };

        for (const [fieldName, config] of Object.entries(newMemberFields)) {
            if (!memberColumns[fieldName]) {
                await queryInterface.addColumn('union_members', fieldName, config);
                console.log(`✅ Đã thêm cột ${fieldName}`);
            }
        }

        // --- BƯỚC 2: TẠO CÁC BẢNG MỚI (CHỈ TẠO NẾU CHƯA CÓ) ---
        console.log('⏳ Đang kiểm tra và tạo các bảng liên quan mới...');

        const tables = await sequelize.getQueryInterface().showAllTables();

        // 2.1 MembershipApproval
        if (!tables.includes('membership_approvals')) {
            await queryInterface.createTable('membership_approvals', {
                id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
                unionMemberId: { type: DataTypes.UUID, allowNull: false, unique: true },
                decisionNumber: { type: DataTypes.STRING, allowNull: false },
                approvedDate: { type: DataTypes.DATEONLY },
                approvedBy: { type: DataTypes.STRING },
                note: { type: DataTypes.TEXT },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false }
            });
            console.log('✅ Bảng membership_approvals');
        }

        // 2.2 MemberEvaluation
        if (!tables.includes('member_evaluations')) {
            await queryInterface.createTable('member_evaluations', {
                id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
                unionMemberId: { type: DataTypes.UUID, allowNull: false },
                year: { type: DataTypes.INTEGER, allowNull: false },
                trainingScore: { type: DataTypes.FLOAT, defaultValue: 0 },
                classification: { 
                    type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'AVERAGE', 'WEAK'), 
                    defaultValue: 'AVERAGE' 
                },
                note: { type: DataTypes.TEXT },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false }
            });
            try {
                await queryInterface.addIndex('member_evaluations', ['unionMemberId', 'year'], { unique: true });
                console.log('✅ Bảng member_evaluations (w/ unique index)');
            } catch (e) {
                console.log('ℹ️ Index đã tồn tại trên member_evaluations');
            }
        }

        // 2.3 MemberReward
        if (!tables.includes('member_rewards')) {
            await queryInterface.createTable('member_rewards', {
                id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
                unionMemberId: { type: DataTypes.UUID, allowNull: false },
                title: { type: DataTypes.STRING, allowNull: false },
                content: { type: DataTypes.TEXT },
                issuedDate: { type: DataTypes.DATEONLY },
                issuedBy: { type: DataTypes.STRING },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false }
            });
            await queryInterface.addIndex('member_rewards', ['unionMemberId']);
            console.log('✅ Bảng member_rewards');
        }

        // 2.4 MemberDiscipline
        if (!tables.includes('member_disciplines')) {
            await queryInterface.createTable('member_disciplines', {
                id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
                unionMemberId: { type: DataTypes.UUID, allowNull: false },
                title: { type: DataTypes.STRING, allowNull: false },
                content: { type: DataTypes.TEXT },
                issuedDate: { type: DataTypes.DATEONLY },
                issuedBy: { type: DataTypes.STRING },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false }
            });
            await queryInterface.addIndex('member_disciplines', ['unionMemberId']);
            console.log('✅ Bảng member_disciplines');
        }

        // 2.5 UserSensitiveData (GCM Encryption)
        if (!tables.includes('user_sensitive_data')) {
            await queryInterface.createTable('user_sensitive_data', {
                id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
                unionMemberId: { type: DataTypes.UUID, allowNull: false, unique: true },
                identityNumberEncrypted: { type: DataTypes.TEXT, allowNull: false },
                iv: { type: DataTypes.STRING, allowNull: false },
                authTag: { type: DataTypes.STRING, allowNull: false },
                idIssueDate: { type: DataTypes.DATEONLY },
                idIssuePlace: { type: DataTypes.STRING },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false }
            });
            console.log('✅ Bảng user_sensitive_data');
        }

        // --- BƯỚC 3: DI CHUYỂN DỮ LIỆU CCCD BẢO MẬT ---
        console.log('⏳ Đang di chuyển và mã hóa dữ liệu CCCD...');
        const [members] = await sequelize.query(`
            SELECT id, "identityNumber" 
            FROM "union_members" 
            WHERE "identityNumber" IS NOT NULL AND "identityNumber" != ''
        `);

        console.log(`Found ${members.length} records to encrypt and migrate.`);

        for (const member of members) {
            const encrypted = encrypt(member.identityNumber);
            if (encrypted) {
                await queryInterface.bulkInsert('user_sensitive_data', [{
                    id: crypto.randomUUID(),
                    unionMemberId: member.id,
                    identityNumberEncrypted: encrypted.encryptedData,
                    iv: encrypted.iv,
                    authTag: encrypted.authTag,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }]);
            }
        }

        // --- BƯỚC 4: BẢO TOÀN DỮ LIỆU ---
        console.log('⏳ Đang bảo toàn dữ liệu cũ...');
        if (memberColumns.identityNumber) {
            await queryInterface.renameColumn('union_members', 'identityNumber', 'deprecated_identityNumber');
            console.log('✅ Đã đổi tên identityNumber thành deprecated_identityNumber (Bảo toàn dữ liệu)');
        }

        console.log('\n🎉 Toàn bộ quá trình Migration hoàn tất an toàn!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
