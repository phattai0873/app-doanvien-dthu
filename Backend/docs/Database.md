# Mô tả các Thực thể (Entities) trong Hệ thống

## 1. Hệ thống và Tài khoản (System & Security)

### `User` (Người dùng)

- **Mô tả**: Lưu trữ thông tin tài khoản đăng nhập.
- **Các trường chính**: `Username`, `PasswordHash`, `Role`, `TokenDevice`, `LastLogin`, `IsActive`, `IsLocked`.
- **Quan hệ**: Liên kết 1-1 với `UnionMember` (Đảng viên/Đoàn viên).

### `Roles` (Vai trò)

- **Mô tả**: Định nghĩa các quyền hạn trong hệ thống.
- **Các trường chính**: `Code`, `Name`, `Description`, `IsSystem`, `IsActive`.

### `UserRole` (Quyền hạn Người dùng)

- **Mô tả**: Bảng trung gian giữa `User` và `Roles`.

### `AuditLog` (Nhật ký hệ thống)

- **Mô tả**: Theo dõi các thay đổi dữ liệu (Insert, Update, Delete).
- **Các trường chính**: `TableName`, `RecordId`, `Action`, `OldValues`, `NewValues`, `UserId`, `IpAddress`.

---

## 2. Cơ cấu Tổ chức (Organization)

### `UnionBranch` (Đảng bộ / Chi bộ cơ sở)

**Mô tả**: Đơn vị tổ chức cấp trên.

**Các trường chính**: `Code`, `Name`, `PartyLevel`, `SecretaryId` (Bí thư), `DeputySecretaryId` (Phó bí thư), `OfficeAddress`, `PhoneNumber`.

### `UnionCell` (Chi bộ / Tổ đảng)

- **Mô tả**: Đơn vị cơ sở trực thuộc `UnionBranch`.
- **Các trường chính**: `Code`, `Name`, `UnionBranchId`, `SecretaryId`, `DeputySecretaryId`, `MemberCount`.

### `UnionMember` (Đảng viên / Đoàn viên)

- **Mô tả**: Thực thể cốt lõi lưu giữ thông tin chi tiết về từng thành viên.
- **Các trường chính**: `MemberCode`, `FullName`, `DateOfBirth`, `Gender`, `IdentityNumber`, `Email`, `PhoneNumber`, `Address`, `JoinedDate`, `OfficialDate`, `MemberCardNumber`, `JoinedPlace`, `EducationLevel`, `PoliticalTheoryLevel`, `Occupation`.
- **Quan hệ**: Thuộc về 1 `UnionCell` và 1 `UnionBranch`. Có thể có nhiều chức vụ (`Positions`).

### `UnionPosition` (Chức vụ)

- **Mô tả**: Danh mục các chức vụ trong tổ chức (Bí thư, Phó bí thư, Ủy viên...).
- **Các trường chính**: `Name`, `ScopeLevel`, `Description`.

### `UnionMemberPosition` (Phân công Chức vụ)

- **Mô tả**: Chi tiết chức vụ của thành viên tại một đơn vị cụ thể theo thời gian.
- **Các trường chính**: `UnionMemberId`, `UnionPositionId`, `UnionCellId`, `AssignedDate`, `EndedDate`, `IsActive`.

---

## 3. Hoạt động và Hội họp (Activities & Meetings)

### `Activity` (Hoạt động / Sự kiện)

- **Mô tả**: Các chương trình, phong trào, hoạt động tình nguyện.
- **Các trường chính**: `Title`, `Description`, `StartDate`, `EndDate`, `Location`, `Point` (Điểm rèn luyện), `IsMandatory`.

### `Attendance` (Điểm danh Hoạt động)

- **Mô tả**: Ghi nhận sự tham gia của thành viên vào các hoạt động.
- **Các trường chính**: `ActivityId`, `UnionMemberId`, `AttendanceTime`, `Status` (Vắng, Có mặt, Có phép), `Remarks`.

### `CellMeeting` (Cuộc họp Chi bộ)

- **Mô tả**: Lịch họp và nội dung các buổi sinh hoạt chi bộ.
- **Các trường chính**: `ChiBoId`, `Title`, `Content`, `MeetingTime`, `ChairpersonId` (Chủ trì), `SecretaryId` (Thư ký), `Minutes` (Biên bản), `Status`.

### `CellMeetingLocation` (Địa điểm)

- **Mô tả**: Danh mục nơi tổ chức các cuộc họp, sự kiện.

---

## 4. Nội dung và Truyền thông (Content & News)

### `News` (Tin tức)

- **Mô tả**: Các bài báo, thông tin nội bộ.
- **Các trường chính**: `Title`, `Summary`, `Content`, `ThumbnailUrl`, `CategoryId`, `Status` (Bản nháp, Đã đăng), `PublishedAt`.

### `NewsCategories` (Danh mục tin tức)

- **Mô tả**: Phân loại tin tức (Thông báo, Tin hoạt động, Gương điển hình...).

### `Document` (Văn bản / Tài liệu)

- **Mô tả**: Kho lưu trữ các nghị quyết, chỉ thị, văn bản hướng dẫn.
- **Các trường chính**: `Title`, `FilePath`, `FileType`, `CategoryId`, `IssuedDate`, `IssuingAuthority`.

### `DocumentCategories` (Danh mục tài liệu)

- **Mô tả**: Phân loại tài liệu (Nghị quyết, Kế hoạch, Báo cáo...).

---

## 5. Thông báo (Notiffications)

### `Notification` (Thông báo)

- **Mô tả**: Hệ thống gửi tin nhắn đến cá nhân hoặc đơn vị.
- **Các trường chính**: `Title`, `Content`, `Type`, `TargetType`, `Priority`, `Status`.

### `NotificationReadStatus` (Trạng thái xem)

- **Mô tả**: Theo dõi ai đã đọc thông báo nào và vào lúc nào.

---

## 6. Đào tạo và Khảo sát (Examination / Quiz)

### `QuizExams` (Kỳ thi / Khảo sát)

- **Mô tả**: Các cuộc thi tìm hiểu chính trị, khảo sát ý kiến.
- **Các trường chính**: `Title`, `Description`, `TimeLimit`, `SatisfactoryScore`, `StartDate`, `EndDate`.

### `QuizQuestion` (Câu hỏi)

- **Mô tả**: Nội dung câu hỏi trong kỳ thi.
- **Các trường chính**: `ExamId`, `QuestionType`, `Score`, `Order`.

### `QuizOption` (Đáp án)

- **Mô tả**: Các lựa chọn trả lời cho câu hỏi.

### `QuizAttemps` (Lượt làm bài)

- **Mô tả**: Kết quả làm bài của thành viên.
- **Các trường chính**: `ExamId`, `PartyMemberId`, `Score`, `CorrectAnswersCount`, `SubmitTime`.

---

## 7. Tài chính (Finance)

### `UnionFeePayment` (Đóng phí)

- **Mô tả**: Theo dõi quá trình nộp đảng phí / đoàn phí.
- **Các trường chính**: `UnionMemberId`, `Period` (Tháng/Quý), `Amount`, `PaymentDate`, `Note`.
