@echo off
echo Dang khoi dong toan bo cac dich vu...

start "Backend" cmd /k "cd Backend && npm run dev"
start "Frontend" cmd /k "cd Frontend && npm run dev"
start "Landing Page" cmd /k "cd LangdingPage && npm run dev"
start "Mobile" cmd /k "cd Mobile && npx expo start"

echo Khoi dong hoan tat! Vui long kiem tra cac cua so hien len.
pause
