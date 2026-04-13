const { sequelize } = require('../configs/db');
const User = require('./User');
const ImportPreview = require('./ImportPreview');

// Relationships
User.hasMany(ImportPreview, { foreignKey: 'createdBy' });
ImportPreview.belongsTo(User, { foreignKey: 'createdBy' });
const Role = require('./Role');
const Permission = require('./Permission');
const AuditLog = require('./AuditLog');
const UnionBranch = require('./UnionBranch');
const UnionCell = require('./UnionCell');
const UnionMember = require('./UnionMember');
const UnionPosition = require('./UnionPosition');
const UnionMemberPosition = require('./UnionMemberPosition');
const UnionMemberHistory = require('./UnionMemberHistory');
const Activity = require('./Activity');
const ActivityParticipant = require('./ActivityParticipant');
const Attendance = require('./Attendance');
const Meeting = require('./Meeting');
const News = require('./News');
const NewsCategory = require('./NewsCategory');
const NewsLike = require('./NewsLike');
const NewsComment = require('./NewsComment');
const NewsCommentLike = require('./NewsCommentLike');
const NewsCommentReport = require('./NewsCommentReport');
const Document = require('./Document');
const DocumentCategory = require('./DocumentCategory');
const Notification = require('./Notification');
const NotificationReadStatus = require('./NotificationReadStatus');
const QuizExam = require('./QuizExam');
const QuizQuestion = require('./QuizQuestion');
const QuizOption = require('./QuizOption');
const QuizAttempt = require('./QuizAttempt');
const UnionFeePayment = require('./UnionFeePayment');
const CellMeetingLocation = require('./CellMeetingLocation');
const Banner = require('./Banner');
const LandingConfig = require('./LandingConfig');
const UnionFeeType = require('./UnionFeeType');
const PaymentTransaction = require('./PaymentTransaction');
const BankSetting = require('./BankSetting');
const ProfileUpdateRequest = require('./profileUpdateRequest');
const FeeCollection = require('./FeeCollection');
const FeeItem = require('./FeeItem');
const FeeCollectionScope = require('./FeeCollectionScope');
const FeePayment = require('./FeePayment');
const MembershipApproval = require('./MembershipApproval');
const MemberEvaluation = require('./MemberEvaluation');
const MemberReward = require('./MemberReward');
const MemberDiscipline = require('./MemberDiscipline');
const UserSensitiveData = require('./UserSensitiveData');

// Associations

// User & Role (Many-to-Many)
User.belongsToMany(Role, { through: 'UserRoles' });
Role.belongsToMany(User, { through: 'UserRoles' });

// Role & Permission (Many-to-Many)
Role.belongsToMany(Permission, { through: 'RolePermissions' });
Permission.belongsToMany(Role, { through: 'RolePermissions' });

// User & UnionMember (One-to-One)
User.hasOne(UnionMember, { foreignKey: 'userId' });
UnionMember.belongsTo(User, { foreignKey: 'userId' });

UnionMember.belongsTo(User, { as: 'Approver', foreignKey: 'approvedBy' });
User.hasMany(UnionMember, { foreignKey: 'approvedBy' });

// AuditLog & User
User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// UnionBranch & UnionCell
UnionBranch.hasMany(UnionCell, { foreignKey: 'unionBranchId' });
UnionCell.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

// User Scope Associations
User.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });
UnionBranch.hasMany(User, { foreignKey: 'unionBranchId' });
User.belongsTo(UnionCell, { foreignKey: 'unionCellId' });
UnionCell.hasMany(User, { foreignKey: 'unionCellId' });

// UnionCell & UnionMember
UnionCell.hasMany(UnionMember, { foreignKey: 'unionCellId' });
UnionMember.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

// UnionBranch Leaders
UnionBranch.belongsTo(UnionMember, { foreignKey: 'secretaryId', as: 'SecretaryOfBranch' });
UnionBranch.belongsTo(UnionMember, { foreignKey: 'deputySecretaryId', as: 'DeputySecretaryOfBranch' });

// UnionCell Leaders
UnionCell.belongsTo(UnionMember, { foreignKey: 'secretaryId', as: 'SecretaryOfCell' });
UnionCell.belongsTo(UnionMember, { foreignKey: 'deputySecretaryId', as: 'DeputySecretaryOfCell' });

// UnionMember & UnionPosition via UnionMemberPosition
UnionMember.belongsToMany(UnionPosition, { through: UnionMemberPosition, foreignKey: 'unionMemberId' });
UnionPosition.belongsToMany(UnionMember, { through: UnionMemberPosition, foreignKey: 'unionPositionId' });
// UnionMemberPosition also relates to UnionCell & UnionBranch
UnionCell.hasMany(UnionMemberPosition, { foreignKey: 'unionCellId' });
UnionMemberPosition.belongsTo(UnionCell, { foreignKey: 'unionCellId' });
UnionBranch.hasMany(UnionMemberPosition, { foreignKey: 'unionBranchId' });
UnionMemberPosition.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

// UnionMember History
UnionMember.hasMany(UnionMemberHistory, { foreignKey: 'unionMemberId' });
UnionMemberHistory.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

// Activity & Attendance
Activity.hasMany(Attendance, { foreignKey: 'activityId' });
Attendance.belongsTo(Activity, { foreignKey: 'activityId' });

// Meeting & Attendance
Meeting.hasMany(Attendance, { foreignKey: 'meetingId', as: 'Attendances' });
Attendance.belongsTo(Meeting, { foreignKey: 'meetingId' });

UnionBranch.hasMany(Activity, { foreignKey: 'unionBranchId' });
Activity.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

Activity.belongsTo(UnionBranch, { foreignKey: 'organizedByBranchId', as: 'OrganizerBranch' });
Activity.belongsTo(UnionCell, { foreignKey: 'organizedByCellId', as: 'OrganizerCell' });
UnionBranch.hasMany(Activity, { foreignKey: 'organizedByBranchId', as: 'OrganizedActivities' });
UnionCell.hasMany(Activity, { foreignKey: 'organizedByCellId', as: 'OrganizedActivities' });

UnionMember.hasMany(Attendance, { foreignKey: 'unionMemberId' });
Attendance.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

// Meeting
Meeting.belongsTo(UnionBranch, { foreignKey: 'organizerBranchId', as: 'OrganizerBranch' });
Meeting.belongsTo(UnionCell, { foreignKey: 'organizerCellId', as: 'OrganizerCell' });
UnionBranch.hasMany(Meeting, { foreignKey: 'organizerBranchId' });
UnionCell.hasMany(Meeting, { foreignKey: 'organizerCellId' });

Meeting.belongsTo(UnionMember, { foreignKey: 'chairpersonId', as: 'Chairperson' });
Meeting.belongsTo(UnionMember, { foreignKey: 'secretaryId', as: 'Secretary' });
Meeting.belongsTo(CellMeetingLocation, { foreignKey: 'locationId', as: 'Location' });

// Activity & Participant
Activity.hasMany(ActivityParticipant, { foreignKey: 'activityId' });
ActivityParticipant.belongsTo(Activity, { foreignKey: 'activityId' });

UnionMember.hasMany(ActivityParticipant, { foreignKey: 'memberId' });
ActivityParticipant.belongsTo(UnionMember, { foreignKey: 'memberId' });

// News & Categories
NewsCategory.hasMany(News, { foreignKey: 'categoryId' });
News.belongsTo(NewsCategory, { foreignKey: 'categoryId' });

User.hasMany(News, { foreignKey: 'authorId' });
News.belongsTo(User, { foreignKey: 'authorId' });

UnionBranch.hasMany(News, { foreignKey: 'unionBranchId' });
News.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

UnionCell.hasMany(News, { foreignKey: 'unionCellId' });
News.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

// News & NewsLike
News.hasMany(NewsLike, { foreignKey: 'newsId', as: 'NewsLikes' });
NewsLike.belongsTo(News, { foreignKey: 'newsId' });

User.hasMany(NewsLike, { foreignKey: 'userId' });
NewsLike.belongsTo(User, { foreignKey: 'userId' });

// News & NewsComment
News.hasMany(NewsComment, { foreignKey: 'newsId', as: 'Comments' });
NewsComment.belongsTo(News, { foreignKey: 'newsId' });

User.hasMany(NewsComment, { foreignKey: 'userId' });
NewsComment.belongsTo(User, { foreignKey: 'userId' });

// Self-referencing for replies (1 level recommended)
NewsComment.hasMany(NewsComment, { foreignKey: 'parentId', as: 'Replies' });
NewsComment.belongsTo(NewsComment, { foreignKey: 'parentId', as: 'Parent' });

// NewsComment & NewsCommentLike
NewsComment.hasMany(NewsCommentLike, { foreignKey: 'commentId', as: 'CommentLikes' });
NewsCommentLike.belongsTo(NewsComment, { foreignKey: 'commentId' });

User.hasMany(NewsCommentLike, { foreignKey: 'userId' });
NewsCommentLike.belongsTo(User, { foreignKey: 'userId' });

// NewsComment & NewsCommentReport
NewsComment.hasMany(NewsCommentReport, { foreignKey: 'commentId', as: 'Reports' });
NewsCommentReport.belongsTo(NewsComment, { foreignKey: 'commentId' });

User.hasMany(NewsCommentReport, { foreignKey: 'userId' });
NewsCommentReport.belongsTo(User, { foreignKey: 'userId' });

// Document & Categories
DocumentCategory.hasMany(Document, { foreignKey: 'categoryId' });
Document.belongsTo(DocumentCategory, { foreignKey: 'categoryId' });

UnionBranch.hasMany(Document, { foreignKey: 'unionBranchId' });
Document.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

UnionCell.hasMany(Document, { foreignKey: 'unionCellId' });
Document.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

// Notification & ReadStatus
Notification.hasMany(NotificationReadStatus, { foreignKey: 'notificationId', as: 'ReadStatuses' });
NotificationReadStatus.belongsTo(Notification, { foreignKey: 'notificationId' });

User.hasMany(NotificationReadStatus, { foreignKey: 'userId' });
NotificationReadStatus.belongsTo(User, { foreignKey: 'userId' });

// Quiz
QuizExam.hasMany(QuizQuestion, { foreignKey: 'examId' });
QuizQuestion.belongsTo(QuizExam, { foreignKey: 'examId' });

UnionBranch.hasMany(QuizExam, { foreignKey: 'unionBranchId' });
QuizExam.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

UnionCell.hasMany(QuizExam, { foreignKey: 'unionCellId' });
QuizExam.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

QuizQuestion.hasMany(QuizOption, { foreignKey: 'questionId' });
QuizOption.belongsTo(QuizQuestion, { foreignKey: 'questionId' });

QuizExam.hasMany(QuizAttempt, { foreignKey: 'examId' });
QuizAttempt.belongsTo(QuizExam, { foreignKey: 'examId' });

UnionMember.hasMany(QuizAttempt, { foreignKey: 'unionMemberId' });
QuizAttempt.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

// Finance
UnionMember.hasMany(UnionFeePayment, { foreignKey: 'unionMemberId' });
UnionFeePayment.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionCell.hasMany(UnionFeePayment, { foreignKey: 'unionCellId' });
UnionFeePayment.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

UnionBranch.hasMany(UnionFeePayment, { foreignKey: 'unionBranchId' });
UnionFeePayment.belongsTo(UnionBranch, { foreignKey: 'unionBranchId' });

UnionFeeType.hasMany(UnionFeePayment, { foreignKey: 'unionFeeTypeId' });
UnionFeePayment.belongsTo(UnionFeeType, { foreignKey: 'unionFeeTypeId' });

// PaymentTransaction associations
UnionMember.hasMany(PaymentTransaction, { foreignKey: 'unionMemberId' });
PaymentTransaction.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionFeeType.hasMany(PaymentTransaction, { foreignKey: 'unionFeeTypeId' });
PaymentTransaction.belongsTo(UnionFeeType, { foreignKey: 'unionFeeTypeId' });

PaymentTransaction.hasOne(UnionFeePayment, { foreignKey: 'paymentTransactionId' });
UnionFeePayment.belongsTo(PaymentTransaction, { foreignKey: 'paymentTransactionId' });

// ProfileUpdateRequest
UnionMember.hasMany(ProfileUpdateRequest, { foreignKey: 'unionMemberId' });
ProfileUpdateRequest.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });
ProfileUpdateRequest.belongsTo(User, { as: 'Approver', foreignKey: 'approvedBy' });
User.hasMany(ProfileUpdateRequest, { foreignKey: 'approvedBy' });

// Enterprise Fee System
UnionFeeType.hasMany(FeeCollection, { foreignKey: 'feeTypeId' });
FeeCollection.belongsTo(UnionFeeType, { foreignKey: 'feeTypeId' });

FeeCollection.hasMany(FeeItem, { foreignKey: 'feeCollectionId', as: 'Items' });
FeeItem.belongsTo(FeeCollection, { foreignKey: 'feeCollectionId' });

FeeCollection.hasMany(FeeCollectionScope, { foreignKey: 'feeCollectionId', as: 'Scopes' });
FeeCollectionScope.belongsTo(FeeCollection, { foreignKey: 'feeCollectionId' });

FeeItem.hasMany(FeePayment, { foreignKey: 'feeItemId' });
FeePayment.belongsTo(FeeItem, { foreignKey: 'feeItemId' });

UnionMember.hasMany(FeePayment, { foreignKey: 'unionMemberId' });
FeePayment.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

PaymentTransaction.hasMany(FeePayment, { foreignKey: 'paymentTransactionId', as: 'Payments' });
FeePayment.belongsTo(PaymentTransaction, { foreignKey: 'paymentTransactionId' });

PaymentTransaction.belongsTo(User, { as: 'Approver', foreignKey: 'approvedBy' });
User.hasMany(PaymentTransaction, { foreignKey: 'approvedBy', as: 'ApprovedTransactions' });

// Associations for FeeCollectionScope to Branch/Cell
FeeCollectionScope.belongsTo(UnionBranch, { foreignKey: 'scopeId', constraints: false, as: 'Branch' });
FeeCollectionScope.belongsTo(UnionCell, { foreignKey: 'scopeId', constraints: false, as: 'Cell' });

// Member Expansion Associations
UnionMember.hasOne(MembershipApproval, { foreignKey: 'unionMemberId', as: 'Approval' });
MembershipApproval.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionMember.hasMany(MemberEvaluation, { foreignKey: 'unionMemberId', as: 'Evaluations' });
MemberEvaluation.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionMember.hasMany(MemberReward, { foreignKey: 'unionMemberId', as: 'Rewards' });
MemberReward.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionMember.hasMany(MemberDiscipline, { foreignKey: 'unionMemberId', as: 'Disciplines' });
MemberDiscipline.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

UnionMember.hasOne(UserSensitiveData, { foreignKey: 'unionMemberId', as: 'SensitiveData' });
UserSensitiveData.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

module.exports = {
    User, ImportPreview, Role, Permission, AuditLog,
    UnionBranch, UnionCell, UnionMember, UnionMemberHistory,
    UnionPosition, UnionMemberPosition,
    Activity, ActivityParticipant, Attendance, Meeting,
    News, NewsCategory, NewsLike, NewsComment, NewsCommentLike, NewsCommentReport,
    Document, DocumentCategory,
    Notification, NotificationReadStatus,
    QuizExam, QuizQuestion, QuizOption, QuizAttempt,
    UnionFeePayment, UnionFeeType, PaymentTransaction, CellMeetingLocation, Banner, LandingConfig, BankSetting,
    FeeCollection, FeeItem, FeeCollectionScope, FeePayment,
    ProfileUpdateRequest,
    MembershipApproval, MemberEvaluation, MemberReward, MemberDiscipline, UserSensitiveData,
    sequelize
};
