<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quy tắc làm việc (Workflow Rules)
- **Quyền hạn thao tác (Full Permissions)**: Được toàn quyền truy cập và chủ động thực thi mọi thao tác cần thiết (sửa đổi code, chạy lệnh kiểm tra, build, git commit...) trong phạm vi dự án mà không cần hỏi lại xin phép người dùng.
- **Git Commit & Push**: Sau khi hoàn thành xong bất kỳ tính năng nào thì thực hiện `git commit`. CHỈ thực hiện `git push` khi người dùng yêu cầu trực tiếp (tuyệt đối không tự ý push).
