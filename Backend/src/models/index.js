const User = require('./User');
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
// UnionMemberPosition also relates to UnionCell
UnionCell.hasMany(UnionMemberPosition, { foreignKey: 'unionCellId' });
UnionMemberPosition.belongsTo(UnionCell, { foreignKey: 'unionCellId' });

// UnionMember History
UnionMember.hasMany(UnionMemberHistory, { foreignKey: 'unionMemberId' });
UnionMemberHistory.belongsTo(UnionMember, { foreignKey: 'unionMemberId' });

// Activity & Attendance (Nếu vẫn dùng - tuy nhiên ActivityParticipant được ưu tiên hơn)
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

module.exports = {
    User, Role, Permission, AuditLog,
    UnionBranch, UnionCell, UnionMember, UnionMemberHistory,
    UnionPosition, UnionMemberPosition,
    Activity, ActivityParticipant, Attendance, Meeting,
    News, NewsCategory,
    Document, DocumentCategory,
    Notification, NotificationReadStatus,
    QuizExam, QuizQuestion, QuizOption, QuizAttempt,
    UnionFeePayment, CellMeetingLocation, Banner, LandingConfig
};
